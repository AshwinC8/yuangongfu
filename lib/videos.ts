// Every clip the site plays, in one place. Components take their src from here and
// the preloader downloads from the same list, so the two can't drift apart — the
// shared-file cache (lib/shared-video.ts) is keyed on this exact string, query
// included. Bump the `?v=` when a clip is replaced: filenames aren't hashed and
// /videos is cached for a day (see next.config.mjs).

export const VIDEO = {
  hero: "/videos/hero.mp4",
  meditation: "/videos/practice-meditation.mp4?v=2",
  healing: "/videos/healing.mp4",
  qigong: "/videos/practice-qigong.mp4",
  taijiquan: "/videos/practice-taijiquan.mp4",
  sanda: "/videos/practice-sanda.mp4",
  xingyiquan: "/videos/practice-xingyiquan.mp4",
  corporate: "/videos/corporate.mp4?v=2",
  philosophy: "/videos/philosphy.mp4",
  aboutMe: "/videos/about%20me.mp4?v=2",
} as const;

// Download order once the page has loaded: what's seen first, then what a visitor
// is most likely to tap or scroll to next, small clips ahead of the big ones.
export const PRELOAD_ORDER: readonly string[] = [
  VIDEO.hero,
  VIDEO.meditation,
  VIDEO.healing,
  VIDEO.qigong,
  VIDEO.taijiquan,
  VIDEO.sanda,
  VIDEO.corporate,
  VIDEO.philosophy,
  VIDEO.aboutMe,
  VIDEO.xingyiquan,
];
