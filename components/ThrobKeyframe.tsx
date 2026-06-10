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

    // font-variation-settings can't be GPU-composited: every computed-value
    // change forces text re-layout + repaint. Quantizing the curve into
    // discrete stops held by steps(1,end) means layout only fires when the
    // weight jumps a bucket (~every 20ms mid-spike) instead of every frame,
    // and not at all during the rest tail. The ease-in-out shape is baked
    // into the stop values, replacing the smooth timing function.
    const STEPS = 16; // buckets per rise/fall phase — ~50-unit jumps, imperceptible
    const span  = wghtMax - wghtMin;
    const eio   = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const stop  = (pct: number, w: number) =>
      `${+pct.toFixed(3)}%{font-variation-settings:'wght' ${w};animation-timing-function:steps(1,end)}`;

    const kf = (name: string) => {
      let body = "";
      for (let k = 0; k < STEPS; k++)
        body += stop((k / STEPS) * peakPct, Math.round(wghtMin + span * eio(k / STEPS)));
      body += stop(peakPct, wghtMax);
      for (let k = 1; k < STEPS; k++)
        body += stop(peakPct + (k / STEPS) * (endPct - peakPct), Math.round(wghtMax - span * eio(k / STEPS)));
      body += `${endPct}%,100%{font-variation-settings:'wght' ${wghtMin}}`;
      return `@keyframes ${name}{${body}}`;
    };

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
