// Query-string switches for working out what costs frames on a device with no
// devtools (an iPad). All are read-only diagnostics; normal visitors never see them.
//
//   ?perf           on-screen meter (fps, slow frames, renderers, videos, GL work)
//   ?strips=dom     wordmark strips on the CSS renderer (the default on touch devices)
//   ?strips=gl      wordmark strips on WebGL (the default on laptops) — use it to
//                   force WebGL on an iPad
//   ?strips=off     strips laid out but never drawn
//   ?touch=on|off   pretend this is / isn't a touch-first device (picks the default
//                   strip renderer)
//   ?videos=off     no video ever plays
//   ?preload=off    don't pre-download the clips; they load on demand as before
//   ?hd=on|off      play the sharper laptop clips / the lighter tablet ones, whatever
//                   the screen (default: sharper on a non-touch screen over 1300px)
//
// Combine them (?perf&strips=off) and compare the meter between runs.

export function queryFlag(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}
