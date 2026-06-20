"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  /** Still frame shown before the clip loads/plays — improves perceived load. */
  poster?: string;
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
  poster,
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

  // Play only while on/near screen, and don't fetch until then (preload="none").
  // The infinite-scroll engine renders the page in triplicate, so without this
  // every off-screen copy would also download and decode. Mirrors the Hero's
  // IntersectionObserver gating (200px head start before it scrolls in).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop={delayMs <= 0}
      playsInline
      preload="none"
      aria-label={ariaLabel}
    />
  );
}
