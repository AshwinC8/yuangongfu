# Yuan Gong Fu — Website

Next.js (App Router, TypeScript) build.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Feature: Throb Animation (variable-font weight pulse)

The wordmark **YUANGONGFU** pulses in a wave using the Web Animations API and a variable font's `wght` axis — no CSS keyframe files, no GSAP.

### How it works

Each letter (or group of letters) is wrapped in its own `<span data-pos={i}>`. On mount, `ThrobWord.tsx` fires one `element.animate()` per span with a three-keyframe weight spike:

```
wghtMin → wghtMax (peak) → wghtMin → wghtMin (rest)
  0          peakOffset      spikeEnd        1
```

The `delay` for each span is `pos × stagger`, so the wave travels left-to-right across the word. The total cycle duration is computed as:

```
totalDuration = spikeDur + rest + stagger × (numLetters - 1)
```

This means every letter's animation is the same duration — they just start at different offsets — so the whole set stays in lockstep forever without drift.

### Tunable parameters (via `AnimConfigContext`)

| Param | Default | What it does |
|-------|---------|--------------|
| `wghtMin` | 100 | Thin weight (baseline) |
| `wghtMax` | 900 | Fat weight (peak of spike) |
| `spikeDur` | 0.70s | How long the up-then-down spike takes |
| `stagger` | 0.10s | Delay between consecutive spans |
| `rest` | 1.80s | Quiet time after the full wave passes |
| `spread` | 0.12 | Fraction of the cycle each span stays lit |
| `density` | 2 | Chars per span (2 = pairs share one animation) |
| `mode` | `"line"` | `"line"` animates whole text runs; `"word"` animates word by word |

All parameters are live-editable through `AnimControlPanel` without remounting — the `useEffect` in `ThrobWord` re-runs whenever `config` changes and cancels + recreates all animations cleanly.

### Performance notes

- Pure Web Animations API — runs on the compositor thread, no JS per frame.
- `prefers-reduced-motion` is checked on mount; animation is skipped entirely if the user has it enabled.
- `density: 2` (default) halves the number of animated elements vs. per-character mode.

---

## Feature: Infinite Scroll Viewport

The entire page scrolls infinitely — there is no top or bottom. The content is cloned N times and stacked; when the user approaches a seam, the scroll position is silently teleported to keep them in the middle clone. The effect is seamless looping.

### Architecture

`InfiniteScrollViewport` renders `numCopies` (default 3) identical copies of `children` in a flex column inside a `position: fixed` wrapper. A single `requestAnimationFrame` loop drives a **lerped** (eased) transform on the track div — native scroll is never used.

```
[copy 0]   ← never visible under normal use
[copy 1]   ← user always lands here
[copy 2]   ← never visible under normal use
```

### The teleport seam

The loop runs every frame and checks:

```
if currentScroll < pageHeight × 0.5  → add pageHeight to all scroll refs
if currentScroll ≥ pageHeight × 1.5  → subtract pageHeight from all scroll refs
```

Both `currentScroll` (rendered position) and `targetScroll` (where the easing is heading) are shifted by the same amount, so momentum is preserved across the seam — there is no lurch.

### Why `useLayoutEffect` for the first measurement

`pageHeight` is read synchronously before the first paint using `useLayoutEffect`. The transform is applied immediately in the same effect so the browser never paints the un-offset position (which would be the top of copy 0 instead of copy 1).

### Smooth easing

```
currentScroll += (targetScroll - currentScroll) × ease   // default ease = 0.13
```

`ease = 0.13` means ~13% of the gap closes each frame — gives a smooth deceleration. The value is prop-injectable for sections that need snappier or floatier feel.

### Velocity tracking

```
rawVelocity     = currentScroll - lastScroll   // pixels/frame
velocity        = velocity × 0.85 + rawVelocity × 0.15
```

A smoothed velocity value is broadcast to subscribers so child components (parallax layers, etc.) can react to scroll speed.

### `ScrollContext` — subscribing without re-renders

Child components never read scroll position from React state. Instead they call `subscribe(callback)` from `ScrollContext`. The RAF loop calls every subscriber each frame directly — zero React re-renders, zero prop drilling, zero virtual DOM overhead for scroll-driven motion.

```tsx
const { subscribe } = useContext(ScrollContext);
useEffect(() => {
  return subscribe(({ localScroll, velocity }) => {
    myRef.current.style.transform = `translateY(${localScroll * 0.3}px)`;
  });
}, [subscribe]);
```

### Input handling

| Input | Handling |
|-------|----------|
| Mouse wheel | `wheel` event (non-passive) → increments `targetScroll` |
| Touch | `touchmove` (non-passive) → increments `targetScroll` with 1.5× multiplier |
| Resize / font load | `ResizeObserver` on first copy → updates `pageHeight`, scroll refs scaled proportionally |

---

## Project structure

```
app/
  fonts.ts                   # font loading (next/font)
  fonts/                     # local .woff2
  globals.css                # design tokens + base styles
  layout.tsx                 # applies font CSS variables
  page.tsx                   # home page
components/
  ThrobWord.tsx              # variable-font weight pulse animation
  ThrobKeyframe.tsx          # keyframe variant of the throb (CSS-driven)
  AnimConfigContext.tsx      # shared animation config + live controls context
  AnimControlPanel.tsx       # dev panel for tweaking anim params live
  InfiniteScrollViewport.tsx # infinite looping scroll engine
  ScrollPause.tsx            # pauses scroll in a region
  Navbar.tsx
  Hero.tsx
  About.tsx
  Intro.tsx
  Band.tsx
  Philosophy.tsx
  Practice.tsx
  Testimonials.tsx
  Enterprise.tsx
  WordmarkStrip.tsx
  Footer.tsx
lib/
  scroll-context.ts          # ScrollContext type definitions + context object
```
