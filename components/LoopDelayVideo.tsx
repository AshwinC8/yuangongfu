"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  /**
   * Pause between the end of one play-through and the start of the next.
   * 0 (default) = seamless continuous loop via the native `loop` attribute.
   */
  delayMs?: number;
  "aria-label"?: string;
};

// delayMs > 0: plays once, holds on the last frame for delayMs, then restarts.
// delayMs <= 0: native `loop` — a gapless, JS-free continuous loop.
export default function LoopDelayVideo({
  src,
  className,
  delayMs = 0,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (delayMs <= 0) return; // continuous loop handled by the `loop` attribute
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
      loop={delayMs <= 0}
      playsInline
      preload="auto"
      aria-label={ariaLabel}
    />
  );
}
