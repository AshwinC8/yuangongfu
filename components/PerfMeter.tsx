"use client";
// On-device performance meter, shown only with ?perf in the URL (see lib/perf.ts).
// Built for an iPad with no devtools: scroll and screenshot it, then repeat with
// ?perf&strips=off or ?perf&videos=off — whichever flag makes "slow" drop is the cost.
//
// It paints its own <pre> outside React so it doesn't add renders, and ignores
// pointer events so it can't interfere with the page's touch scrolling.

import { useEffect } from "react";
import { queryFlag } from "@/lib/perf";
import { scrollActivity } from "@/lib/scroll-activity";
import { peekWordmarkEngine } from "@/lib/wordmark-gl/engine";

// ?videos=off: nothing plays. Patched at import time so it is already in place
// when the first component effect calls play().
if (queryFlag("videos") === "off") {
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    this.pause();
    return Promise.resolve();
  };
}

const WINDOW_MS = 5000;

export default function PerfMeter() {
  useEffect(() => {
    if (queryFlag("perf") === null) return;

    const box = document.createElement("pre");
    box.style.cssText =
      "position:fixed;left:8px;top:88px;z-index:2147483647;margin:0;padding:8px 10px;" +
      "border-radius:8px;background:rgba(0,0,0,.82);color:#9f9;pointer-events:none;" +
      "font:11px/1.4 ui-monospace,Menlo,monospace;white-space:pre";
    document.body.appendChild(box);

    // rAF timestamps from the last WINDOW_MS; `head` skips expired ones cheaply.
    const times: number[] = [];
    let head = 0;
    let peakSpeed = 0;
    let peakAt = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      times.push(t);
      while (head < times.length && times[head] < t - WINDOW_MS) head++;
      if (head > 512) {
        times.splice(0, head);
        head = 0;
      }
      if (scrollActivity.speed > peakSpeed) peakSpeed = scrollActivity.speed;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let lastDraws = 0;
    let lastPixels = 0;
    let lastAt = performance.now();

    const render = () => {
      const now = performance.now();

      const deltas: number[] = [];
      for (let i = head + 1; i < times.length; i++) deltas.push(times[i] - times[i - 1]);
      const sorted = [...deltas].sort((a, b) => a - b);
      const at = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
      const median = at(0.5);
      const slow = deltas.filter((d) => d > median * 1.5).length;
      let fps = 0;
      for (let i = times.length - 1; i >= head && times[i] > now - 1000; i--) fps++;

      const strips = document.querySelectorAll<HTMLElement>("[data-renderer]");
      let gl = 0;
      strips.forEach((s) => {
        if (s.dataset.renderer === "gl") gl++;
      });

      const videos = document.querySelectorAll("video");
      let playing = 0;
      let loaded = 0;
      videos.forEach((v) => {
        if (!v.paused && !v.ended) playing++;
        if (v.currentSrc) loaded++;
      });

      const engine = peekWordmarkEngine();
      const dt = Math.max(1, now - lastAt) / 1000;
      const draws = engine ? (engine.stats.draws - lastDraws) / dt : 0;
      const mpx = engine ? (engine.stats.pixels - lastPixels) / dt / 1e6 : 0;
      if (engine) {
        lastDraws = engine.stats.draws;
        lastPixels = engine.stats.pixels;
      }
      lastAt = now;

      if (now - peakAt > 3000) {
        peakSpeed = 0;
        peakAt = now;
      }

      const flags = ["strips", "videos", "touch"]
        .map((f) => [f, queryFlag(f)] as const)
        .filter(([, v]) => v)
        .map(([f, v]) => `${f}=${v}`)
        .join(" ");

      box.textContent = [
        `${innerWidth}x${innerHeight} @${devicePixelRatio}x  ~${median ? Math.round(1000 / median) : "?"}Hz${flags ? "  " + flags : ""}`,
        `fps ${fps}   p95 ${at(0.95).toFixed(1)}ms   worst ${at(1).toFixed(0)}ms   slow ${slow}/${deltas.length}`,
        `strips gl ${gl} / dom ${strips.length - gl}   draws ${draws.toFixed(0)}/s  ${mpx.toFixed(1)} Mpx/s`,
        `video ${playing} playing / ${loaded} loaded / ${videos.length}`,
        `scroll ${scrollActivity.speed.toFixed(1)} px/f   peak ${peakSpeed.toFixed(0)}`,
      ].join("\n");
    };
    const id = window.setInterval(render, 500);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      box.remove();
    };
  }, []);

  return null;
}
