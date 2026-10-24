// Latest scroll speed, published by InfiniteScrollViewport every frame. Plain
// module state rather than context: the reader (the ?perf overlay) lives outside
// React's render cycle and polls it from rAF.

export const scrollActivity = {
  /** Current speed, CSS px per 60 Hz frame (0 once scrolling has settled). */
  speed: 0,
};

export function reportScrollSpeed(velocity: number) {
  scrollActivity.speed = Math.abs(velocity);
}
