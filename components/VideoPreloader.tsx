"use client";
// Starts the one-copy-per-clip download (lib/shared-video.ts) once the page has
// loaded, so the hero and first paint get all the bandwidth first.

import { useEffect } from "react";
import { queryFlag } from "@/lib/perf";
import { preloadVideos } from "@/lib/shared-video";
import { PRELOAD_ORDER } from "@/lib/videos";

type Connection = { saveData?: boolean; effectiveType?: string };

export default function VideoPreloader() {
  useEffect(() => {
    // ?preload=off / ?videos=off: leave clips to load on demand (for A/B on a device).
    if (queryFlag("preload") === "off" || queryFlag("videos") === "off") return;

    // Respect Data Saver and very slow links: ~40 MB isn't worth it there.
    const conn = (navigator as Navigator & { connection?: Connection }).connection;
    if (conn?.saveData || /^(slow-2g|2g|3g)$/.test(conn?.effectiveType ?? "")) return;

    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => preloadVideos(PRELOAD_ORDER), 300);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", start);
    };
  }, []);

  return null;
}
