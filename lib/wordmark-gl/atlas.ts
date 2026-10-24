// Glyph atlas for the WebGL wordmark strips.
//
// One cell per (letter group × weight bucket), pre-rasterized once with the
// page's real display font. Two sources of truth, deliberately split:
//   • advance widths + baseline come from the DOM (getBoundingClientRect on the
//     same styles the CSS renderer uses), so the "bolder letters push their
//     neighbours" effect and the vertical placement match the DOM exactly;
//   • only the ink is drawn on a 2D canvas, using font-weight (which maps onto
//     the 'wght' axis because the @font-face declares a 100–900 range).
// A width cross-check at build time throws if the canvas disagrees with the DOM
// (weight not mapped, letterSpacing unsupported…), and the caller falls back to
// the DOM renderer rather than showing wrong glyphs.

import { STATIC_COLUMN } from "./model";

export type Atlas = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  /** Distinct group strings; the index is the "string id" used by the shader. */
  strings: string[];
  /** Weight columns per string. */
  columns: number;
  /** Advance in CSS px, indexed [stringId * columns + column]. */
  advance: Float32Array;
  cellW: number;
  cellH: number;
  /** Cells per atlas row. */
  cols: number;
  /** Transparent margin left of the ink origin inside each cell, device px. */
  padPx: number;
};

type BuildOptions = {
  fontSize: number;
  /** Device pixels per CSS pixel. */
  ratio: number;
  strings: string[];
  /** One weight per column, STATIC_COLUMN last. */
  weights: number[];
  maxTexture: number;
};

type TextCtx = CanvasRenderingContext2D & { letterSpacing: string; fontKerning: string };

const LETTER_SPACING_EM = 0.02; // must match rowStyle in WordmarkStripDom

export async function buildAtlas(o: BuildOptions): Promise<Atlas> {
  const { fontSize, ratio, strings, weights, maxTexture } = o;
  const columns = weights.length;

  // Measure in <body>, not inside a strip: the atlas is shared and cached, and
  // a strip can unmount mid-build (zero-size measurements would be cached).
  // --font-display is defined at :root, so body inherits it.
  const container = document.body;
  const family = resolveFamily(container);
  const spec = (w: number) => `${w} ${fontSize}px ${family}`;
  await Promise.all([document.fonts.load(spec(weights[0])), document.fonts.load(spec(Math.max(...weights)))]);
  await document.fonts.ready;

  const { advance, baseline } = measureInDom(container, family, fontSize, strings, weights);

  // ── Cell geometry ────────────────────────────────────────────────
  let maxAdv = 0;
  for (const a of advance) if (a > maxAdv) maxAdv = a;
  // Margin so bold glyph overshoot past its advance box isn't clipped.
  const padPx = Math.ceil(Math.ceil(fontSize * 0.15) * ratio);
  const cellW = Math.ceil(maxAdv * ratio) + padPx * 2;
  const cellH = Math.round(fontSize * ratio);

  const cells = strings.length * columns;
  const cols = Math.max(1, Math.min(cells, Math.floor(maxTexture / cellW)));
  const rows = Math.ceil(cells / cols);
  const width = cols * cellW;
  const height = rows * cellH;
  if (height > maxTexture) throw new Error(`atlas ${width}x${height} exceeds texture limit ${maxTexture}`);

  // ── Ink ──────────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as TextCtx | null;
  if (!ctx) throw new Error("2D canvas unavailable");
  if (!("letterSpacing" in ctx)) throw new Error("canvas letterSpacing unsupported");

  ctx.fillStyle = "#000";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fontKerning = "auto";
  ctx.letterSpacing = `${LETTER_SPACING_EM * fontSize * ratio}px`;

  const baseY = Math.round(baseline * ratio);
  for (let s = 0; s < strings.length; s++) {
    for (let j = 0; j < columns; j++) {
      const cell = s * columns + j;
      const cx = (cell % cols) * cellW;
      const cy = Math.floor(cell / cols) * cellH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cellW, cellH); // the DOM clips each row to its box too
      ctx.clip();
      ctx.font = `${weights[j]} ${fontSize * ratio}px ${family}`;
      ctx.fillText(strings[s], cx + padPx, cy + baseY);
      ctx.restore();
    }
  }

  // ── Cross-check canvas vs DOM ────────────────────────────────────
  // Widest weight, first string: if canvas text metrics don't track the DOM's,
  // the weight axis isn't being applied (or spacing differs) and the atlas
  // would show the wrong glyphs.
  const probeCol = columns - 2; // widest animated bucket
  ctx.font = `${weights[probeCol]} ${fontSize * ratio}px ${family}`;
  const canvasW = ctx.measureText(strings[0]).width / ratio;
  const domW = advance[probeCol];
  if (Math.abs(canvasW - domW) > Math.max(1.5, domW * 0.03)) {
    throw new Error(`canvas/DOM text width mismatch (canvas ${canvasW.toFixed(2)}px vs DOM ${domW.toFixed(2)}px)`);
  }

  return { canvas, width, height, strings, columns, advance, cellW, cellH, cols, padPx };
}

// Resolve var(--font-display) to the concrete family list, in the same font
// scope the strips render in. Canvas font strings can't contain var().
function resolveFamily(container: HTMLElement): string {
  const probe = document.createElement("span");
  probe.style.fontFamily = "var(--font-display)";
  container.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily;
  probe.remove();
  return family;
}

// Measures every (string, weight) advance and the row baseline with real DOM
// layout — one forced layout for all of it.
function measureInDom(
  container: HTMLElement,
  family: string,
  fontSize: number,
  strings: string[],
  weights: number[],
): { advance: Float32Array; baseline: number } {
  const host = document.createElement("div");
  const s = host.style;
  s.position = "absolute";
  s.left = "0";
  s.top = "0";
  s.visibility = "hidden";
  s.pointerEvents = "none";
  s.whiteSpace = "nowrap";
  s.fontFamily = family;
  s.fontSize = `${fontSize}px`;
  s.letterSpacing = `${LETTER_SPACING_EM}em`;
  s.lineHeight = `${fontSize}px`;

  const spans: HTMLSpanElement[] = [];
  for (const text of strings) {
    for (let j = 0; j < weights.length; j++) {
      const span = document.createElement("span");
      span.textContent = text;
      // The static column is the page's un-animated look: no variation settings.
      if (j !== STATIC_COLUMN) span.style.fontVariationSettings = `'wght' ${weights[j]}`;
      host.appendChild(span);
      spans.push(span);
    }
  }

  // Baseline: an empty inline-block sits on the baseline, so its bottom edge is it.
  const line = document.createElement("div");
  line.style.height = `${fontSize}px`;
  line.append("Y");
  const marker = document.createElement("span");
  marker.style.display = "inline-block";
  line.appendChild(marker);
  host.appendChild(line);

  container.appendChild(host);
  const advance = new Float32Array(spans.length);
  for (let i = 0; i < spans.length; i++) advance[i] = spans[i].getBoundingClientRect().width;
  const baseline = marker.getBoundingClientRect().bottom - line.getBoundingClientRect().top;
  host.remove();

  return { advance, baseline };
}
