"use client";
import { useEffect, useRef } from "react";
import { useAnimConfig } from "./AnimConfigContext";

// Renderless — injects one <style> tag with the @keyframes rule and sets --wm-anim globally.
// Duration is NOT set here; each WordmarkStrip sets its own --wm-dur based on its row length.
export default function ThrobKeyframe() {
  const { config } = useAnimConfig();
  const flipRef = useRef(false);

  useEffect(() => {
    const { wghtMin, wghtMax, spread } = config;

    // Flip animation name so the browser sees a new animation → immediate restart
    // with the updated keyframe values. Both names are always defined so neither dangles.
    flipRef.current = !flipRef.current;
    const active = flipRef.current ? "wm-throb-a" : "wm-throb-b";

    // spread controls what fraction of the full cycle a group stays "lit".
    // peakPct = half of that (rise); endPct = full spread (fall back to rest).
    // Smaller spread → narrower wave (fewer groups lit simultaneously).
    const peakPct = Math.max(1, Math.round(spread * 50));
    const endPct  = Math.max(2, Math.round(spread * 100));

    const kf = (name: string) =>
      `@keyframes ${name}{` +
        `0%{font-variation-settings:'wght' ${wghtMin}}` +
        `${peakPct}%{font-variation-settings:'wght' ${wghtMax}}` +
        `${endPct}%,100%{font-variation-settings:'wght' ${wghtMin}}` +
      `}`;

    let styleEl = document.getElementById("wm-kf") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "wm-kf";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = kf("wm-throb-a") + "\n" + kf("wm-throb-b");

    document.documentElement.style.setProperty("--wm-anim", active);
  }, [config]);

  return null;
}
