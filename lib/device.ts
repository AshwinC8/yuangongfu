// Is this a touch-first device (iPad, Android tablet, phone) rather than a laptop
// or desktop? Used to pick the CSS wordmark strips on touch devices and WebGL on
// laptops, which have a GPU and a mouse/trackpad.
//
// `(pointer: coarse)` covers phones and Android tablets. iPadOS Safari identifies
// itself as a Mac (and may report a fine pointer when a keyboard/trackpad is
// attached), but a real Mac has no touch points while an iPad has several, so
// "MacIntel with touch points" catches it. A Windows touch-screen laptop keeps a
// fine primary pointer, so it stays on WebGL.
//
// ?touch=on|off forces the answer, for testing the rule on any machine.

import { queryFlag } from "./perf";

export function isTouchFirstDevice(): boolean {
  if (typeof window === "undefined") return false;
  const forced = queryFlag("touch");
  if (forced === "on") return true;
  if (forced === "off") return false;
  if (window.matchMedia("(pointer: coarse)").matches) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}
