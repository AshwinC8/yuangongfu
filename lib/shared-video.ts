// One downloaded copy of each clip, shared by every <video> that plays it.
//
// The page renders three times (infinite scroll) and Practice shows its clips in
// two places, so the same handful of mp4 files back ~45 <video> elements. Left to
// themselves each element starts its own network request when it first plays —
// the delay that makes a clip pop in over its poster — and iOS Safari streams
// media through its own loader that doesn't reuse the page's HTTP cache, so
// prefetching with fetch() alone doesn't help it.
//
// So after the page has loaded, each clip is downloaded once, in full, into a Blob
// and exposed as a single blob: URL. An element that hasn't loaded anything yet
// (preload="none") is pointed at that URL just before it plays, and starts from
// memory. Anything that isn't ready yet — slow connection, clip still queued —
// simply plays from its normal URL, exactly as before. A blob that fails to play
// falls back to the network URL.
//
// Laptop-sized screens get the sharper file of a clip when it has one (HD_VIDEO in
// lib/videos.ts). Callers keep passing the clip's usual URL; it is swapped for the
// sharper one here, so nothing else has to know which screen it is on.

import { isTouchFirstDevice } from "./device";
import { queryFlag } from "./perf";
import { HD_VIDEO } from "./videos";

type Entry = { blobUrl?: string; bytes: number };

const entries = new Map<string, Entry>();
const queue: string[] = [];
const CONCURRENCY = 2; // leave bandwidth for whatever the visitor is actually watching
let running = 0;

// Laptop-sized screen? Decided once per page load, so a clip never changes file
// midway (a resize would otherwise download it again). The width is the CSS
// laptop/tablet breakpoint; a touch-first device stays on the lighter files whatever
// its width (an iPad Pro in landscape is 1366px). ?hd=on|off forces the answer.
let hd: boolean | undefined;

function wantsHd(): boolean {
  if (typeof window === "undefined") return false;
  if (hd === undefined) {
    const forced = queryFlag("hd");
    hd =
      forced === "on" ||
      (forced !== "off" && window.matchMedia("(min-width: 1301px)").matches && !isTouchFirstDevice());
  }
  return hd;
}

/** The URL a clip really plays from on this screen: its sharper file if it has one, else itself. */
function clipUrl(url: string): string {
  return (wantsHd() && HD_VIDEO[url]) || url;
}

/** The shared blob: URL for a clip if it has been downloaded, else the URL it plays from here. */
export function videoSrc(url: string): string {
  const real = clipUrl(url);
  return entries.get(real)?.blobUrl ?? real;
}

/** Queue clips for download, in order. Safe to call repeatedly; each clip is fetched once. */
export function preloadVideos(urls: readonly string[]) {
  for (const key of urls) {
    const url = clipUrl(key);
    if (entries.has(url)) continue;
    entries.set(url, { bytes: 0 });
    queue.push(url);
  }
  pump();
}

function pump() {
  while (running < CONCURRENCY && queue.length > 0) {
    const url = queue.shift()!;
    running++;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const entry = entries.get(url);
        if (!entry) return;
        entry.blobUrl = URL.createObjectURL(blob); // kept for the life of the page, on purpose
        entry.bytes = blob.size;
      })
      .catch(() => {
        // Leave the clip on its network URL.
      })
      .finally(() => {
        running--;
        pump();
      });
  }
}

/**
 * Point `v` at a clip, using the shared download when there is one. Pass
 * `resume` when the caller is about to play() it: if the shared copy turns out
 * not to play, the element falls back to the network URL and — since changing
 * src resets it to paused — has to be started again.
 */
export function setVideoSrc(v: HTMLVideoElement, url: string, resume = false) {
  const shared = videoSrc(url);
  v.src = shared;
  if (shared !== url) {
    v.addEventListener(
      "error",
      () => {
        if (v.getAttribute("src") !== shared) return;
        v.src = url;
        if (resume) v.play().catch(() => {});
      },
      { once: true },
    );
  }
}

/**
 * Call just before play(): an element that has not loaded anything yet is switched
 * to the shared download (or, on a laptop, the sharper file), so it starts instantly.
 * One that is already loading or playing is left alone — changing src would restart it.
 */
export function adoptSharedSrc(v: HTMLVideoElement, url: string) {
  if (v.readyState !== 0) return;
  const shared = videoSrc(url);
  if (shared === url || v.getAttribute("src") === shared) return;
  setVideoSrc(v, url, true);
}

/** For the ?perf overlay. */
export function sharedVideoStats() {
  let ready = 0;
  let bytes = 0;
  entries.forEach((e) => {
    if (e.blobUrl) {
      ready++;
      bytes += e.bytes;
    }
  });
  return { ready, total: entries.size, bytes };
}
