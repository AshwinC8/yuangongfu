# iPad / Safari performance

Target devices: iPad Pro 12.9" (5th gen, 120 Hz → 8.3 ms per frame) and iPad Air
(60 Hz). From 1301px wide up (iPad Pro landscape) the site shows the full laptop
layout — four hero panels, all six wordmark strips.

## Why iPad is the hard case

- **Scrolling runs on the main thread.** `InfiniteScrollViewport` handles
  `touchmove` with `preventDefault` and moves one tall track with `translate3d` from
  a rAF loop, so Safari can't scroll on the compositor. Anything else that runs on
  the main thread (strip redraws, hero-video scheduling, React) competes with it.
- **The page is rendered three times** (the infinite loop), so anything per-section
  exists in triplicate: 45 `<video>` elements, 18 strips.
- Safari/iPadOS has a much smaller memory budget than a laptop.

I could not run Safari or an iPad while making these changes, and the automation
Chrome throttles rAF to ~1 fps, so none of the *speed* below was measured as frames
per second. What was measured: element counts, bytes, pixels drawn, and that behaviour
is unchanged. Use `?perf` (below) on the device to measure the rest.

## What changed

| Change | Effect |
|---|---|
| Hero clip loaded only in the page copy near the screen (`Hero.tsx`) | Loaded hero videos 12 → 4 on desktop layout, 12 → 1 on tablet/phone. Others show the poster and drop their `src`. |
| Strip visibility via one `IntersectionObserver` (`engine.ts`) | Removes 18 `getBoundingClientRect` reads per frame (forced layout inside the scroll loop); the strip loop idles when no strip is in range. |
| Strips hold still during fast flicks on touch devices | Above 14 px per 60 Hz frame of scroll speed the strips keep their last frame and resume below 8. Laptops (fine pointer) never do this. `?freeze=on\|off` overrides. |
| Corporate clip re-encoded (12.4 → 6.7 MB) | crf 30 from the 1080p source; same size/duration/frames, BT.709 tags kept. |
| Meditation clip re-encoded at native 800×450 (4.2 → 1.6 MB) | Its source is 800×450; the old 1280×720 file was an upscale. 2.5× fewer pixels to decode on the clip that is open by default. |
| CSS strips by default on touch devices (`lib/device.ts`) | iPads, Android tablets and phones use the CSS renderer; laptops keep WebGL. On the iPad Pro's laptop layout that means ~7,600 animated letter spans across the three page copies (vs ~950 DOM nodes in total with WebGL) — chosen because the CSS version was observed to run well on the iPad. Flip back with one line in `getWordmarkEngine()`. |
| `?perf` meter and switches | See below. |

Both re-encoded files get `?v=2` on their `src` (filenames are unhashed and cached for a day).

## Measuring on the iPad

Open the site with these query flags (combine with `&`):

| Flag | Does |
|---|---|
| `?perf` | Overlay (top-left): viewport/DPR/refresh rate, fps, p95 and worst frame time, slow-frame count, strips on GL vs DOM, GL redraws/s and Mpx/s, strips held back/s, videos playing/loaded/total, scroll speed. |
| `strips=off` | Strips laid out but never drawn. |
| `strips=dom` | Strips on the CSS renderer (the default on iPad / touch devices). |
| `strips=gl` | Strips on WebGL (the default on laptops) — use on an iPad to compare. |
| `touch=on` / `touch=off` | Pretend this is / isn't a touch-first device. |
| `videos=off` | No video plays. |
| `freeze=on` / `freeze=off` | Force the fast-flick hold on or off. |

Scroll the page the same way for each run and compare "slow" and "p95". Whichever
flag makes them drop is what costs frames. (With nothing moving, fps just shows the
display's refresh rate — the numbers are only meaningful while scrolling.)

## Considered and not done

- **Drawing only the visible slice of each strip.** Strips are small (Intro columns
  269×534, Enterprise 110×833, About 110×897, Footer 1376×110 CSS px at 1376 wide) and
  the iPad viewport is 1032px tall, so a slice would save little for the complexity.
- **Re-encoding Xing Yi Quan** (10.4 MB): its bitrate is pinned at the 2 Mbit/s cap by
  fast motion, so any real saving (crf 30 + 1.5 Mbit/s → 7.8 MB) softens the motion.
  Left as is. **Philosophy** (6.9 MB): the raw file is 860×484 and frames differently
  from the shipped file, so it can't be re-encoded safely from it.
- **Unloading the other (non-hero) clips once they scroll far away.** They are
  `preload="none"` and only fetch when played; worth doing only if the meter or a Safari
  tab reload points at memory.
- `public/images/{practice,about,enterprise,band}.jpg` (3.9 MB) are not referenced by
  any page and could be deleted.
- The green "W" shape in the Xing Yi Quan clip (around 15 s, right side) is in the raw
  `.MOV` itself, not an encoding artefact.
