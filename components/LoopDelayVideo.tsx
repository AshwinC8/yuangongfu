"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  /** Pause between the end of one play-through and the start of the next. */
  delayMs?: number;
  "aria-label"?: string;
};

// Plays a muted clip once, holds on its last frame for `delayMs`, then restarts.
// (No native `loop` — we wait for `ended`, pause, then replay.)
export default function LoopDelayVideo({
  src,
  className,
  // Short pause so the clip restarts promptly (hero keeps its own longer timing).
  delayMs = 750,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let timer = 0;
    const onEnded = () => {
      timer = window.setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
      }, delayMs);
    };
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("ended", onEnded);
      clearTimeout(timer);
    };
  }, [delayMs]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-label={ariaLabel}
    />
  );
}
