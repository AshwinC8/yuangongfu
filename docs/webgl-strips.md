# WebGL wordmark strips

Companion to `animation-performance.md`. That doc explains why the CSS version
can't use the GPU: `font-variation-settings` changes glyph *shapes and widths*,
so every weight step costs style + layout + paint on the main thread.

The WebGL renderer avoids that by turning the problem around: **rasterize every
(letter, weight) combination once, then animate by choosing which pre-drawn
picture to show.** Choosing and placing pictures is exactly what a GPU is good at.

## How it works

```
 once (per font size / DPR / weight range)            every frame (visible strips only)
 ┌──────────────────────────────────────┐             ┌────────────────────────────────────┐
 │ DOM measures advance widths + baseline│             │ 1. per letter-group: which weight  │
 │ canvas draws "YU","AN",… × 18 weights │──atlas──▶   │    bucket is it in right now?      │
 │ into one texture (the atlas)          │             │ 2. prefix-sum advances → x positions│
 └──────────────────────────────────────┘             │ 3. ONE instanced draw call         │
                                                       │ 4. copy into the strip's 2D canvas │
                                                       └────────────────────────────────────┘
```

- **Zero DOM per letter.** A strip is one `<canvas>`. No spans, no style recalc,
  no layout, no paint while it animates.
- **Draw only when something moved.** During the long rest tail no group changes,
  so nothing is drawn. While a wave is on screen it redraws each frame (one draw call).
- **Same wave, smoother.** `lib/wordmark-gl/model.ts` reproduces `ThrobKeyframe`'s
  curve and `WordmarkStripDom`'s geometry. The CSS version quantizes the curve into
  eased buckets because each change costs layout; here it's continuous. Checked
  against the real keyframe generator: the smooth curve stays within one bucket-step
  of the CSS value everywhere (240k samples) and peak/rest are exact.
- **Exact metrics.** Advance widths (the "bold letters push their neighbours"
  effect), each letter's position (kerning and letter-spacing included) and the
  baseline are measured from real DOM layout, not estimated. Canvas only draws the
  ink, one letter at a time at those positions — so it needs no canvas
  `letterSpacing` (Safari 18.4+ only) and works on older iPads. Drawing this way
  produced an atlas pixel-identical to the `letterSpacing` version in Chrome.

## Why one shared WebGL context

The infinite scroll renders the page 3× → 18 strips. Browsers allow ~16 live
WebGL contexts and silently kill the oldest. So one offscreen WebGL canvas draws
every strip and each result is copied (GPU→GPU) into that strip's own 2D canvas.
Each strip stays its own compositor layer, so scrolling is still a pure GPU slide.

## Files

| File | Role |
|---|---|
| `components/WordmarkStrip.tsx` | Entry point; picks GL, falls back to DOM |
| `components/WordmarkStripGL.tsx` | DOM shell (container → canvas), forwards size + config |
| `components/WordmarkStripDom.tsx` | The original CSS renderer, unchanged apart from rename |
| `lib/wordmark-gl/model.ts` | Pure math: geometry, timing, weight table |
| `lib/wordmark-gl/atlas.ts` | Builds the glyph atlas; cross-checks canvas vs DOM |
| `lib/wordmark-gl/engine.ts` | Shared context, shaders, per-strip draw, rAF loop |

## A/B testing

- Default → WebGL. Open DevTools console: `[wordmark-gl] WebGL2 strips active — <your GPU>`.
- `?strips=dom` → the original CSS renderer, same page, same build.
- Inspect a strip: `data-renderer="gl"` or `"dom"` on its container.
- If you see `falling back to DOM strips:` in the console, GL rejected itself
  (no WebGL2, software rasterizer, or the canvas text didn't match the DOM) — the
  message says why.

## Why the push is fluid

A bolder letter is wider, so everything to its right shifts. Per weight step that
shift is only 0.4–0.7px — *less than a pixel* — so snapping each letter pair to a
whole pixel made neighbours pop ±1px at different moments (the "weird" movement).
Now:

- Each group's weight is a fractional atlas column; the shader blends the two
  neighbouring columns and the CPU interpolates advances between them.
- Resting positions are still snapped to whole pixels (crisp text). The *push* from
  bolder neighbours is added on top as a fractional offset, and the atlas is sampled
  with linear filtering, so pushed letters glide. At whole-pixel positions linear
  sampling lands on texel centres, so resting text is unchanged.
- Trade-off: a letter mid-push sits between pixels, so it is very slightly softer
  while it moves. If that ever looks wrong, round the `+ g.w` term in the vertex
  shader to get the old snapped behaviour back.

## Knobs

- `STEPS` in `model.ts` — how many weight shapes the atlas stores, evenly spaced in
  weight. Blending hides the steps, so 16 is plenty; more only enlarges the atlas.
- `VIEW_MARGIN` in `engine.ts` — how many viewport-heights beyond the screen a
  strip keeps updating. Generous so strips never arrive frozen.

## Deliberately matched quirks of the DOM version

- Stretched grid items (About/Enterprise accents) size off their content, so the
  GL container reserves the same intrinsic height (`pairs × pitch`). Note the DOM
  version only does this while the strip is on screen (`content-visibility: auto`
  zeroes its height otherwise), so the Enterprise section is 930px off-screen and
  grows to 993px as it scrolls in. GL holds the on-screen value permanently — what
  you see in view is identical, and the mid-scroll 63px height jump is gone.
- The canvas covers the container's **padding box**, not its content box: rows are
  laid out from the content box but `overflow:hidden` clips at the padding edge, so
  they show through padding (the Band strip has 8px top/bottom — GL originally
  clipped them away).
- The Band's thin strip is `display:flex; align-items:center`, which makes the
  DOM version show only its first pair, vertically centred. GL reproduces that.
- Static weight (animation off / reduced motion) is 400, as in the DOM.
