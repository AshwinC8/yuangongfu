// Pure math for the WebGL wordmark strips — no DOM, no GL.
// Mirrors what the CSS renderer computes (WordmarkStripDom geometry +
// ThrobKeyframe keyframes) so the two renderers stay visually interchangeable.

export const WORD = "YUANGONGFU";
export const ROW_GAP = 3;

// Atlas weight columns, evenly spaced between wghtMin and wghtMax. The CSS
// renderer snaps to ~12–16 eased buckets because every change costs layout; here
// the shader blends the two neighbouring columns and interpolates advances, so the
// animation is continuous and STEPS only sets how finely glyph shapes are sampled.
export const STEPS = 16;

// Atlas columns: one per bucket 0..STEPS, plus a final "static" column.
export const WEIGHT_COLUMNS = STEPS + 2;
export const STATIC_COLUMN = STEPS + 1;

// What the DOM shows when the animation is off (font-weight: normal).
export const STATIC_WGHT = 400;

export type ThrobParams = {
  enabled: boolean;
  mode: "line" | "word";
  wghtMin: number;
  wghtMax: number;
  spikeDur: number;
  stagger: number;
  rest: number;
  spread: number;
  density: number;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// Weight for each atlas column: column j (0..STEPS) is j/STEPS of the way from min
// to max, so a fractional column position maps linearly onto weight. The last
// column is the static weight.
export function weightTable(wghtMin: number, wghtMax: number): number[] {
  const span = wghtMax - wghtMin;
  const out: number[] = [];
  for (let j = 0; j <= STEPS; j++) out.push(Math.round(wghtMin + (span * j) / STEPS));
  out.push(STATIC_WGHT);
  return out;
}

// Same keyframe percentages ThrobKeyframe derives from `spread`.
export function keyframePercents(spread: number) {
  return {
    peakPct: Math.max(1, Math.round(spread * 50)),
    endPct: Math.max(2, Math.round(spread * 100)),
  };
}

// Fractional atlas column (0..STEPS) a group sits at, `elapsed` seconds into its
// own timeline (global clock minus the group's animation-delay). This is the
// smooth curve ThrobKeyframe quantizes: ease-in-out up to the peak, ease-in-out
// back down, then rest. Before the delay elapses the CSS uses fill-mode
// backwards, which holds the 0% keyframe — column 0.
export function groupPosition(elapsed: number, dur: number, peakPct: number, endPct: number): number {
  if (elapsed < 0) return 0;
  const pct = ((elapsed % dur) / dur) * 100;
  if (pct >= endPct) return 0;
  const u =
    pct < peakPct
      ? easeInOut(pct / peakPct)
      : 1 - easeInOut((pct - peakPct) / (endPct - peakPct));
  return u * STEPS;
}

export type StripRow = { shift: number; groups: number };

export type StripModel = {
  rowH: number;
  /** Distance between consecutive pairs, replicating the DOM's margin maths. */
  pitch: number;
  /** Height the DOM's stacked pairs add up to — kept so layout matches. */
  contentHeight: number;
  /** Per pair: horizontal shift and how many groups the DOM renders for it. */
  rows: StripRow[];
  groupCount: number;
  /** Text of each group (density chars), indexed by group. */
  groupText: string[];
  /** Animation delay of each group, seconds. */
  groupDelay: Float32Array;
  /** Strip cycle length, seconds. */
  dur: number;
};

export function buildStripModel(w: number, h: number, fontSize: number, p: ThrobParams): StripModel {
  const rowH = fontSize;
  const charW = Math.round(fontSize * 0.72);
  const pairH = (rowH + ROW_GAP) * 2;

  const numPairs = Math.ceil(h / pairH) + 5;
  const maxShift = numPairs * charW;
  const wordW = charW * WORD.length;
  const wordsPerRow = Math.ceil((w + maxShift) / wordW) + 3;
  const rowTextLen = wordsPerRow * WORD.length;

  const d = Math.max(1, Math.round(p.density));
  const numGroups = Math.ceil(rowTextLen / d);
  const maxPos = p.mode === "line" ? numGroups - 1 : Math.ceil(9 / d);
  const dur = p.spikeDur + p.rest + p.stagger * maxPos;

  // Each pair is two stacked 'rowH' boxes overlapping by 5px, and pairs overlap
  // by a further 10px (negative margins in the DOM) → this pitch.
  const pitch = 2 * rowH - 15;

  const rows: StripRow[] = [];
  let groupCount = 0;
  for (let i = 0; i < numPairs; i++) {
    const shift = i * charW;
    // Same clip window the DOM uses: chars past it can never be seen.
    const maxChars = Math.min(rowTextLen, Math.ceil((w + shift) / charW) + WORD.length);
    const groups = Math.ceil(maxChars / d);
    rows.push({ shift, groups });
    if (groups > groupCount) groupCount = groups;
  }

  const groupText: string[] = [];
  const groupDelay = new Float32Array(groupCount);
  for (let g = 0; g < groupCount; g++) {
    const start = g * d;
    let text = "";
    for (let c = start; c < Math.min(start + d, rowTextLen); c++) text += WORD[c % WORD.length];
    groupText.push(text);
    // line: delay follows absolute position (one wave across the row).
    // word: delay repeats every WORD.length chars (each word pulses alone).
    const pos = p.mode === "line" ? start : start % WORD.length;
    groupDelay[g] = +(pos * p.stagger).toFixed(3);
  }

  return { rowH, pitch, contentHeight: numPairs * pitch, rows, groupCount, groupText, groupDelay, dur };
}
