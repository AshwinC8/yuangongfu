// Query-string switches for working out what costs frames on a device with no
// devtools (an iPad). All are read-only diagnostics; normal visitors never see them.
//
//   ?perf           on-screen meter (fps, slow frames, renderers, videos, GL work)
//   ?strips=dom     wordmark strips on the CSS renderer
//   ?strips=off     strips laid out but never drawn
//   ?videos=off     no video ever plays
//   ?freeze=on|off  force the "strips hold still during a fast flick" behaviour on
//                   or off (default: on for touch devices only)
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
