# Yuan Gong Fu — build handoff (for continuing in Claude Code)

A Next.js (App Router, TS) site built section-by-section from a Figma design.
Source of truth for design specs: the `.fig` file, decoded locally (see below).

## Run
```bash
npm install
npm run dev      # http://localhost:3000
```
Next.js 15.5.18 (patched). `npx tsc --noEmit` passes.

## Reading the Figma design from the .fig (no connector needed)
The Figma MCP connector works in Claude Code too, but the most reliable path is
decoding the .fig directly (offline, never rate-limited):

```bash
pip install zstandard
npm install kiwi-schema
python scripts/decode_fig.py "Yuan Gong Fu.fig" .figdata     # -> schema.bin, data.bin, images/
node scripts/decode_kiwi.js .figdata                          # -> .figdata/doc.json
```
`doc.json` has `nodeChanges` (3255 nodes). Build a tree:
- node key = `${guid.sessionID}:${guid.localID}`
- parent = `parentIndex.guid`; sort siblings by `parentIndex.position` (fractional-index string)
- text: `node.textData.characters`, `node.fontName`, `node.fontSize`, `node.textAlignHorizontal`,
  `node.lineHeight`, `node.letterSpacing`, color via `node.fillPaints[0].color` (r/g/b 0..1)
- position/size: `node.transform` (m02=x, m12=y), `node.size`
- images: `fillPaints[].type === "IMAGE"`, hash under `.image`; file is `images/<hash>` (JPEG/PNG)

The target page frame is **"Desktop - 9"**, node id **131:2440** (1440 x 5900).

## Design tokens (from Desktop-9) — app/globals.css
- bg #ffffff, text #000000, accent #bc0000 (red), border #eeeeee, grey pill #d9d9d9
- nav height 79px, page max-width 1440px, side padding 34px
- Fonts: Albert Sans (body, via next/font/google) + Outfit No-Crossbar (wordmark, local woff2)

## Done so far (components/)
1. **Navbar.tsx** — fixed 79px bar, white + 1px #eee bottom border, wordmark (weight 500,
   plain clickable text), two grey #d9d9d9 placeholder blocks (CONTENT TBD), red "book now"
   outline button. Sticky w/ faint shadow on scroll.
2. **Hero.tsx** — four staggered image panels (heights 796/536/430/348) using public/images/hero.jpg
   (same photo cropped 4x, per design). Strip shifted to right 78% w/ space on left (user request).
   Red 48px right-aligned heading "Power begins in stillness", body, "book your free consultation".
3. **Intro.tsx** — "Taijiquan. Qi Gong. Meditation." red 40px centered heading + centered body,
   flanked by two 269px decorative columns of the repeated wordmark (faint #d9d9d9 diagonal weave).

## Open questions / TODO
- Navbar: the two grey blocks are EMPTY in the design — decide their real content (nav links?).
- Hero: confirm whether 4 panels should be 4 different photos (currently 1 photo x4, as in Figma).
- Side-column weave is an approximation of the Figma mask of ~32 wordmark vectors.

## Remaining sections (top->bottom in Desktop-9, by frame Y)
- y~1601 **The Practice** — accordion: Meditation / Qi Gong / Taijiquan / Xing Yi Quan / Sanda,
  image left (Rectangle 13), expandable copy right.
- y~2252 **For your Enterprise** — "Corporate & Workplace Resilience begins within." + bullet copy,
  image right, red "book your free consultation" button.
- y~2971 a full-width band (Rectangle 14, #? ) + decorative wordmark strip.
- y~3346 **The Philosophy** — heading + body.
- y~3813 **About me / About Yuan Gong Fu / Our Mission / Our Vision** — text blocks left, tall image right.
- y~4885 **Testimonials** (Group 15) — Nina / François / Marie-Elena quotes.
- y~5355 footer wordmark band + big "YUANGONGFU" vector lockup + small logo (node "9").

All copy + exact coords are recoverable from doc.json as above.

## Pre-decoded data included
`.figdata/doc.json` — the full decoded Desktop-9 design (no need to re-run the scripts).
`.figdata/images/` — all 18 source images keyed by hash (the real photos for every section).
`.figdata/meta.json` — file metadata.
(If you'd rather regenerate from your local .fig, the scripts/ do exactly that.)
