// WebGL renderer for the wordmark strips.
//
// Why one shared context: the infinite scroll renders the page 3× (18 strips)
// and browsers cap live WebGL contexts at ~16, evicting the oldest. So a single
// offscreen WebGL canvas draws every strip and each frame is copied into that
// strip's own 2D canvas (a GPU→GPU copy). Each strip keeps its own compositor
// layer, so scrolling stays a pure GPU slide of finished bitmaps.
//
// Per strip, per frame — all that runs on the CPU:
//   1. work out each letter-group's (fractional) weight position (a few dozen
//      groups; every row of a strip shares the same groups, shifted);
//   2. prefix-sum their interpolated advances (the "bolder letters push
//      neighbours" effect) as a smooth, sub-pixel offset from the resting layout;
//   3. upload that tiny table and issue ONE instanced draw call.
// The shader crossfades the two atlas columns either side of each group's weight,
// so weight and push are continuous rather than stepped. If no group moved since
// the last draw (the long rest tail), nothing is drawn at all.

import { buildAtlas, type Atlas } from "./atlas";
import {
  STATIC_COLUMN,
  WEIGHT_COLUMNS,
  buildStripModel,
  groupPosition,
  keyframePercents,
  weightTable,
  type StripModel,
  type ThrobParams,
} from "./model";

const VERT = `#version 300 es
precision highp float;
precision highp int;
layout(location = 0) in vec4 a_inst; // group index, shift (device px), row top (device px), mirrored 0|1
uniform highp sampler2D u_data;      // per group: resting x (device px), fractional weight column, string id, push offset (device px)
uniform vec2 u_res;                  // strip size, device px
uniform vec2 u_cell;                 // atlas cell size, device px
uniform vec2 u_atlas;                // atlas size, device px
uniform float u_cols;                // cells per atlas row
uniform float u_columns;             // weight columns per string
uniform float u_pad;                 // transparent margin left of the ink origin, device px
out vec2 v_uv0;
out vec2 v_uv1;
out float v_t;

vec2 cellUV(float cell, vec2 local) {
  vec2 origin = vec2(mod(cell, u_cols), floor(cell / u_cols)) * u_cell;
  return (origin + local * u_cell) / u_atlas;
}

void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec4 g = texelFetch(u_data, ivec2(int(a_inst.x), 0), 0);

  // The resting position snaps to a whole device pixel (crisp text at rest); the
  // push from bolder neighbours is added on top as a fractional offset so letters
  // glide instead of hopping a pixel at a time.
  float x = floor(g.x - a_inst.y + 0.5) + g.w - u_pad;
  vec2 pos = vec2(x, a_inst.z) + corner * u_cell;
  gl_Position = vec4(pos.x / u_res.x * 2.0 - 1.0, 1.0 - pos.y / u_res.y * 2.0, 0.0, 1.0);

  // scaleY(-1) in the DOM: the lower row of each pair is the same cell flipped.
  vec2 local = vec2(corner.x, mix(corner.y, 1.0 - corner.y, a_inst.w));

  // Two atlas columns either side of the fractional weight, blended in the fragment.
  float j0 = floor(g.y);
  float j1 = min(j0 + 1.0, u_columns - 1.0);
  float base = g.z * u_columns;
  v_uv0 = cellUV(base + j0, local);
  v_uv1 = cellUV(base + j1, local);
  v_t = g.y - j0;
}`;

const FRAG = `#version 300 es
precision highp float;
uniform highp sampler2D u_tex;
in vec2 v_uv0;
in vec2 v_uv1;
in float v_t;
out vec4 o_color;
void main() {
  // Text is always #000 — only coverage matters. Premultiplied output.
  float a = mix(texture(u_tex, v_uv0).a, texture(u_tex, v_uv1).a, v_t);
  o_color = vec4(0.0, 0.0, 0.0, a);
}`;

// The strip is drawn when within this many viewport-heights of the screen.
// Generous on purpose: a strip must already be correct when it scrolls in
// (the "arrived frozen" problem the IntersectionObserver version had).
const VIEW_MARGIN = 1;
const MAX_STRIP_PIXELS = 16_000_000;

type Size = { w: number; h: number };

export type StripInput = {
  size?: Size;
  fontSize?: number;
  params?: ThrobParams;
};

export type StripHandle = {
  update(patch: StripInput): void;
  destroy(): void;
};

// What the container's CSS does to the rows it holds. Rows are laid out from the
// content box, but `overflow:hidden` clips at the padding box — so rows show
// through the padding (the Band's strip has 8px of it) and the canvas must too.
type BoxInfo = {
  row: boolean;
  align: string;
  padT: number;
  padR: number;
  padB: number;
  padL: number;
};

type Layout = {
  model: StripModel;
  atlas: Atlas;
  sid: Uint16Array;
  /** Whether groups animate (fixed per layout; a change re-lays-out). */
  animated: boolean;
  /** Resting x of each group (CSS px): advances at column 0 (or static weight). */
  baseX: Float32Array;
  instances: Float32Array;
  instanceCount: number;
  ratio: number;
  /** Canvas box = padding box, in CSS px, and its offset from the content box. */
  cssW: number;
  cssH: number;
  offX: number;
  offY: number;
  pw: number;
  ph: number;
  peakPct: number;
  endPct: number;
};

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`shader compile: ${gl.getShaderInfoLog(sh)}`);
  }
  return sh;
}

class Strip implements StripHandle {
  private input: { size: Size | null; fontSize: number; params: ThrobParams | null } = {
    size: null,
    fontSize: 32,
    params: null,
  };
  private version = 0;
  private dead = false;
  private cur: Layout | null = null;

  private readonly ctx2d: CanvasRenderingContext2D;

  // GL resources, recreated when the shared context is restored.
  private glEpoch = -1;
  private vao: WebGLVertexArrayObject | null = null;
  private instBuf: WebGLBuffer | null = null;
  private dataTex: WebGLTexture | null = null;
  private dataTexW = 0;
  private needsUpload = false;

  private needsDraw = false;
  /** Fractional weight column each group was last drawn at. */
  private lastPos = new Float32Array(0);
  private data = new Float32Array(0);

  animated = false;

  /** Laid out but not yet drawn (e.g. still off-screen) — the loop must keep checking. */
  get pending(): boolean {
    return this.needsDraw && this.cur !== null && !this.dead;
  }

  constructor(
    private readonly engine: Engine,
    private readonly container: HTMLElement,
    private readonly flow: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly onFail: (err: unknown) => void,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx2d = ctx;
  }

  update(patch: StripInput) {
    if (patch.size) this.input.size = patch.size;
    if (patch.fontSize !== undefined) this.input.fontSize = patch.fontSize;
    if (patch.params) this.input.params = patch.params;
    this.relayout();
  }

  /** Recompute geometry and (asynchronously) swap it in once the atlas is ready. */
  relayout() {
    const { size, fontSize, params } = this.input;
    if (this.dead || !size || !params) return;
    const e = this.engine;
    e.syncParams(params);
    const version = ++this.version;
    this.animated = params.enabled && !e.reduced;

    if (size.w <= 0 || size.h <= 0) {
      this.cur = null;
      this.flow.style.height = "0px";
      return;
    }

    const model = buildStripModel(size.w, size.h, fontSize, params);
    const flex = this.readBox();
    // Reproduce the DOM's intrinsic height so swapping renderers can't change
    // the surrounding layout (a stretched grid item sizes off its content).
    this.flow.style.height = `${flex.row ? size.h : model.contentHeight}px`;

    const ratio = e.pickRatio(size.w, size.h);
    const strings = Array.from(new Set(model.groupText));
    e.getAtlas(fontSize, ratio, strings, params).then(
      (atlas) => {
        if (this.dead || version !== this.version) return;
        this.commit(model, atlas, ratio, size, flex, params);
      },
      (err) => this.fail(err),
    );
  }

  private fail(err: unknown) {
    if (this.dead) return;
    console.warn("[wordmark-gl] falling back to DOM strips:", err);
    this.onFail(err);
  }

  // The Band's thin strip is `display:flex; align-items:center`, which turns the
  // DOM version's pair <div>s into flex items: only the first pair is reachable,
  // vertically centred. Reproduce that, since it defines what that strip shows.
  private readBox(): BoxInfo {
    const cs = getComputedStyle(this.container);
    const isFlex = cs.display === "flex" || cs.display === "inline-flex";
    const px = (v: string) => parseFloat(v) || 0;
    return {
      row: isFlex && cs.flexDirection.startsWith("row"),
      align: cs.alignItems,
      padT: px(cs.paddingTop),
      padR: px(cs.paddingRight),
      padB: px(cs.paddingBottom),
      padL: px(cs.paddingLeft),
    };
  }

  private commit(
    model: StripModel,
    atlas: Atlas,
    ratio: number,
    size: Size,
    flex: BoxInfo,
    params: ThrobParams,
  ) {
    const ids = new Map(atlas.strings.map((s, i) => [s, i]));
    const G = model.groupCount;
    const sid = new Uint16Array(G);
    for (let g = 0; g < G; g++) sid[g] = ids.get(model.groupText[g]) ?? 0;

    // Resting layout: every group at its lightest (or the static weight). Pushes
    // are measured as offsets from this, so resting letters stay pixel-snapped.
    const animated = params.enabled && !this.engine.reduced;
    const restCol = animated ? 0 : STATIC_COLUMN;
    const baseX = new Float32Array(G);
    let rest = 0;
    for (let g = 0; g < G; g++) {
      baseX[g] = rest;
      rest += atlas.advance[sid[g] * WEIGHT_COLUMNS + restCol];
    }

    // Canvas = padding box. Row coordinates stay relative to the content box
    // (that's where the DOM lays them out); the canvas origin is shifted by the
    // padding, so rows get +padT and the horizontal shift gets -padL.
    const cssW = size.w + flex.padL + flex.padR;
    const cssH = size.h + flex.padT + flex.padB;

    const R = model.rowH;
    const mirrorDy = R - 5; // lower row of a pair overlaps the upper by 5px
    const out: number[] = [];
    for (let i = 0; i < model.rows.length; i++) {
      if (flex.row && i > 0) break;
      const top0 = flex.row ? this.flexTop(R, size.h, flex.align) : i * model.pitch;
      if (top0 >= size.h + flex.padB) break; // pairs only get lower; the rest are clipped
      const { shift, groups } = model.rows[i];
      for (let m = 0; m < 2; m++) {
        const top = top0 + (m ? mirrorDy : 0);
        if (top >= size.h + flex.padB || top + R <= -flex.padT) continue;
        const topPx = Math.round((top + flex.padT) * ratio);
        for (let g = 0; g < groups; g++) out.push(g, (shift - flex.padL) * ratio, topPx, m);
      }
    }

    const { peakPct, endPct } = keyframePercents(params.spread);
    this.cur = {
      model,
      atlas,
      sid,
      animated,
      baseX,
      instances: new Float32Array(out),
      instanceCount: out.length / 4,
      ratio,
      cssW,
      cssH,
      offX: -flex.padL,
      offY: -flex.padT,
      pw: Math.max(1, Math.round(cssW * ratio)),
      ph: Math.max(1, Math.round(cssH * ratio)),
      peakPct,
      endPct,
    };
    this.data = new Float32Array(G * 4);
    this.lastPos = new Float32Array(G);
    this.dataTexW = 0;
    this.needsUpload = true;
    this.needsDraw = true;
    this.engine.kick();
  }

  // Top of the (single) reachable pair inside a row flex container, from the
  // pair's margin box: border box 2R-10 tall with margin-bottom -10 → 2R-20.
  private flexTop(R: number, h: number, align: string): number {
    const box = 2 * R - 20;
    if (align === "center") return (h - box) / 2;
    if (align === "flex-end" || align === "end") return h - box;
    return 0;
  }

  /** Called every animation frame by the engine. */
  frame(now: number, vw: number, vh: number) {
    const cur = this.cur;
    const e = this.engine;
    if (!cur || cur.instanceCount === 0 || e.lost || this.dead) return;
    if (!this.inView(vw, vh)) return;

    const { model, atlas, sid, ratio, baseX } = cur;
    const G = model.groupCount;
    const pos = this.lastPos;
    let changed = this.needsDraw;

    if (cur.animated) {
      const t = (now - e.epoch) / 1000;
      for (let g = 0; g < G; g++) {
        const p = groupPosition(t - model.groupDelay[g], model.dur, cur.peakPct, cur.endPct);
        // Ignore sub-0.1%-of-a-column drift so the rest tail draws nothing.
        if (Math.abs(p - pos[g]) > 1e-3) {
          pos[g] = p;
          changed = true;
        }
      }
    } else if (changed) {
      pos.fill(STATIC_COLUMN);
    }
    if (!changed) return;

    // Prefix-sum interpolated advances: every row is the same text, so one table
    // serves all. Each group stores its resting x plus the push accumulated from
    // everything to its left (a fractional offset — the shader keeps rest snapped).
    const data = this.data;
    const last = WEIGHT_COLUMNS - 1;
    let x = 0;
    for (let g = 0; g < G; g++) {
      const s = sid[g];
      const p = pos[g];
      const j = Math.floor(p);
      const row = s * WEIGHT_COLUMNS;
      const a0 = atlas.advance[row + j];
      const a1 = atlas.advance[row + Math.min(j + 1, last)];
      data[g * 4] = baseX[g] * ratio;
      data[g * 4 + 1] = p;
      data[g * 4 + 2] = s;
      data[g * 4 + 3] = (x - baseX[g]) * ratio;
      x += a0 + (a1 - a0) * (p - j);
    }

    this.draw(cur);
    this.needsDraw = false;
  }

  private inView(vw: number, vh: number): boolean {
    const r = this.container.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const m = vh * VIEW_MARGIN;
    return r.bottom > -m && r.top < vh + m && r.right > 0 && r.left < vw;
  }

  private ensureGL(gl: WebGL2RenderingContext) {
    if (this.glEpoch !== this.engine.glEpoch) {
      this.vao = gl.createVertexArray();
      this.instBuf = gl.createBuffer();
      this.dataTex = gl.createTexture();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(0, 1);
      gl.bindTexture(gl.TEXTURE_2D, this.dataTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.glEpoch = this.engine.glEpoch;
      this.dataTexW = 0;
      this.needsUpload = true;
    }
  }

  private draw(cur: Layout) {
    const e = this.engine;
    const gl = e.gl;
    const { atlas, model, pw, ph } = cur;

    this.ensureGL(gl);
    e.ensureBuffer(pw, ph);
    const atlasTex = e.atlasTexture(atlas);

    gl.useProgram(e.program);
    gl.bindVertexArray(this.vao);
    if (this.needsUpload) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      gl.bufferData(gl.ARRAY_BUFFER, cur.instances, gl.STATIC_DRAW);
      this.needsUpload = false;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.dataTex);
    const G = model.groupCount;
    if (this.dataTexW !== G) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, G, 1, 0, gl.RGBA, gl.FLOAT, this.data);
      this.dataTexW = G;
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, G, 1, gl.RGBA, gl.FLOAT, this.data);
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);

    const u = e.uniforms;
    gl.uniform2f(u.res, pw, ph);
    gl.uniform2f(u.cell, atlas.cellW, atlas.cellH);
    gl.uniform2f(u.atlas, atlas.width, atlas.height);
    gl.uniform1f(u.cols, atlas.cols);
    gl.uniform1f(u.columns, WEIGHT_COLUMNS);
    gl.uniform1f(u.pad, atlas.padPx);

    // Render into the top-left pw×ph corner of the shared buffer (GL's y is up).
    const bufH = gl.drawingBufferHeight;
    gl.viewport(0, bufH - ph, pw, ph);
    gl.scissor(0, bufH - ph, pw, ph);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cur.instanceCount);

    // Size the bitmap and its CSS box together, in the same task as the draw,
    // so a resize never shows a cleared or stretched frame.
    const canvas = this.canvas;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const cssW = `${cur.cssW}px`;
    const cssH = `${cur.cssH}px`;
    const left = `${cur.offX}px`;
    const topCss = `${cur.offY}px`;
    if (canvas.style.width !== cssW) canvas.style.width = cssW;
    if (canvas.style.height !== cssH) canvas.style.height = cssH;
    if (canvas.style.left !== left) canvas.style.left = left;
    if (canvas.style.top !== topCss) canvas.style.top = topCss;
    this.ctx2d.globalCompositeOperation = "copy";
    this.ctx2d.drawImage(e.canvas, 0, 0, pw, ph, 0, 0, pw, ph);
  }

  /** Context was restored: GL objects are gone, redraw everything. */
  invalidate() {
    this.needsDraw = true;
  }

  destroy() {
    this.dead = true;
    this.version++;
    this.engine.strips.delete(this);
    const e = this.engine;
    if (!e.lost && this.glEpoch === e.glEpoch) {
      const gl = e.gl;
      gl.deleteVertexArray(this.vao);
      gl.deleteBuffer(this.instBuf);
      gl.deleteTexture(this.dataTex);
    }
    this.vao = null;
    this.instBuf = null;
    this.dataTex = null;
    this.cur = null;
  }
}

class Engine {
  readonly canvas: HTMLCanvasElement;
  gl!: WebGL2RenderingContext;
  program!: WebGLProgram;
  uniforms!: Record<"res" | "cell" | "atlas" | "cols" | "columns" | "pad", WebGLUniformLocation | null>;

  /** Bumped whenever the GL context is (re)created; strips compare against it. */
  glEpoch = 0;
  lost = false;
  maxBuffer = 4096;
  maxTexture = 4096;

  readonly strips = new Set<Strip>();
  /** Animation clock origin (ms). Reset when the throb config changes, like ThrobKeyframe's restart. */
  epoch = performance.now();
  reduced = false;

  private paramsSig = "";
  private raf = 0;
  private dpr = window.devicePixelRatio || 1;
  private readonly atlases = new Map<string, Promise<Atlas>>();
  private readonly atlasTextures = new WeakMap<Atlas, { tex: WebGLTexture; epoch: number }>();

  constructor() {
    this.canvas = document.createElement("canvas");
    const gl = this.canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      // Don't take a software rasterizer: the DOM renderer is faster than that.
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.initGL();

    this.canvas.addEventListener("webglcontextlost", (ev) => {
      ev.preventDefault();
      this.lost = true;
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.initGL();
      this.lost = false;
      this.strips.forEach((s) => s.invalidate());
      this.kick();
    });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = mq.matches;
    mq.addEventListener("change", (ev) => {
      this.reduced = ev.matches;
      this.strips.forEach((s) => s.relayout());
    });

    let gpu = "unknown GPU";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) gpu = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
    console.info(`[wordmark-gl] WebGL2 strips active — ${gpu}`);
  }

  private initGL() {
    const gl = this.gl;
    const prog = gl.createProgram();
    if (!prog) throw new Error("createProgram failed");
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`program link: ${gl.getProgramInfoLog(prog)}`);
    }
    this.program = prog;
    gl.useProgram(prog);
    gl.uniform1i(gl.getUniformLocation(prog, "u_data"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 1);
    this.uniforms = {
      res: gl.getUniformLocation(prog, "u_res"),
      cell: gl.getUniformLocation(prog, "u_cell"),
      atlas: gl.getUniformLocation(prog, "u_atlas"),
      cols: gl.getUniformLocation(prog, "u_cols"),
      columns: gl.getUniformLocation(prog, "u_columns"),
      pad: gl.getUniformLocation(prog, "u_pad"),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);

    this.maxTexture = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, 8192);
    this.maxBuffer = Math.min(this.maxTexture, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number);
    this.glEpoch++;
  }

  /** Throb config changed → restart the wave, as ThrobKeyframe's name flip does. */
  syncParams(p: ThrobParams) {
    const sig = `${p.enabled}|${p.mode}|${p.wghtMin}|${p.wghtMax}|${p.spikeDur}|${p.stagger}|${p.rest}|${p.spread}|${p.density}`;
    if (sig !== this.paramsSig) {
      this.paramsSig = sig;
      this.epoch = performance.now();
    }
  }

  /** Device pixels per CSS pixel to render a strip of this size at. */
  pickRatio(w: number, h: number): number {
    const dpr = window.devicePixelRatio || 1;
    const bySide = this.maxBuffer / Math.max(w, h);
    const byArea = Math.sqrt(MAX_STRIP_PIXELS / (w * h));
    return Math.max(0.5, Math.min(dpr, bySide, byArea));
  }

  getAtlas(fontSize: number, ratio: number, strings: string[], params: ThrobParams): Promise<Atlas> {
    const weights = weightTable(params.wghtMin, params.wghtMax);
    const key = [fontSize, ratio, weights.join(","), strings.join(",")].join("|");
    let p = this.atlases.get(key);
    if (!p) {
      p = buildAtlas({ fontSize, ratio, strings, weights, maxTexture: this.maxTexture });
      this.atlases.set(key, p);
      p.catch(() => this.atlases.delete(key));
    }
    return p;
  }

  atlasTexture(atlas: Atlas): WebGLTexture {
    const cached = this.atlasTextures.get(atlas);
    if (cached && cached.epoch === this.glEpoch) return cached.tex;
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("createTexture failed");
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Linear so a pushed letter can sit between pixels. At whole-pixel positions
    // (everything at rest) sample points land on texel centres, so it's exact.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
    this.atlasTextures.set(atlas, { tex, epoch: this.glEpoch });
    return tex;
  }

  /** Grow the shared drawing buffer to fit a strip (never shrinks — avoids thrash). */
  ensureBuffer(pw: number, ph: number) {
    const c = this.canvas;
    if (c.width < pw || c.height < ph) {
      c.width = Math.max(c.width, pw);
      c.height = Math.max(c.height, ph);
    }
  }

  createStrip(opts: {
    container: HTMLElement;
    flow: HTMLElement;
    canvas: HTMLCanvasElement;
    onFail: (err: unknown) => void;
  }): StripHandle {
    const strip = new Strip(this, opts.container, opts.flow, opts.canvas, opts.onFail);
    this.strips.add(strip);
    return strip;
  }

  kick() {
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.lost || this.strips.size === 0) return;

    // Zoom or a move to another monitor changes the pixel ratio without
    // necessarily resizing any strip, so check explicitly.
    const dpr = window.devicePixelRatio || 1;
    if (dpr !== this.dpr) {
      this.dpr = dpr;
      this.strips.forEach((s) => s.relayout());
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let again = false;
    this.strips.forEach((s) => {
      s.frame(now, vw, vh);
      if (s.animated || s.pending) again = true;
    });
    // Static strips (animation off / reduced motion) only need the loop until
    // their first draw; after that they redraw only when kicked.
    if (again) this.kick();
  };
}

let engine: Engine | null | undefined;

/** Shared engine, or null when WebGL2 can't (or shouldn't) be used. */
export function getWordmarkEngine(): Engine | null {
  if (engine !== undefined) return engine;
  try {
    // ?strips=dom forces the CSS renderer, for A/B comparison.
    if (new URLSearchParams(window.location.search).get("strips") === "dom") {
      engine = null;
    } else {
      engine = new Engine();
    }
  } catch (err) {
    console.warn("[wordmark-gl] WebGL unavailable, using DOM strips:", err);
    engine = null;
  }
  return engine;
}

export type { Engine };
