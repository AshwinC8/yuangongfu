"use client";

import { useEffect, useRef, useState } from "react";
import ownStyles from "./CrossfadeVideo.module.css";

type Props = {
  src: string;
  className?: string;
  poster?: string;
  "aria-label"?: string;
};

// Like LoopDelayVideo, but for a video whose `src` switches at runtime
// (e.g. Practice's accordion swapping clips per item). A single <video>
// resets to blank/poster the instant its src changes and stays there until
// the new clip has enough data — that reads as a flash back to a "default"
// frame. Two stacked layers alternate instead: the incoming clip loads and
// starts playing on the hidden layer, which only fades in once real frames
// are flowing, so the outgoing clip stays fully visible right up to the
// handoff and the switch reads as a smooth crossfade.
export default function CrossfadeVideo({
  src,
  className,
  poster,
  "aria-label": ariaLabel,
}: Props) {
  // Layer 0 keeps its JSX-bound initial src forever (React never revisits it
  // since the prop backing it never changes); every later swap — including
  // ones that target layer 0 again — is applied imperatively via refs. This
  // keeps React's reconciliation and the imperative writes from fighting
  // over the same attribute.
  const [initialSrc] = useState(src);
  const layer0 = useRef<HTMLVideoElement>(null);
  const layer1 = useRef<HTMLVideoElement>(null);
  const layers = [layer0, layer1] as const;

  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<0 | 1>(0);
  const activeRef = useRef<0 | 1>(0);
  const shownSrcRef = useRef(src);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Play only while on/near screen, and don't fetch until then (preload="none").
  // The infinite-scroll engine renders the page in triplicate, so without this
  // every off-screen copy would also download and decode. Mirrors LoopDelayVideo.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) layers[activeRef.current].current?.play().catch(() => {});
        else layers.forEach((l) => l.current?.pause());
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch clips: load + play the new src on the hidden layer, then fade it
  // in once it's actually producing frames (rather than on `src` change).
  useEffect(() => {
    if (src === shownSrcRef.current) return;
    const outgoing = activeRef.current;
    const target: 0 | 1 = outgoing === 0 ? 1 : 0;
    const v = layers[target].current;
    if (!v) return;
    let cancelled = false;
    v.pause();
    v.src = src;
    v.currentTime = 0;
    const onPlaying = () => {
      if (cancelled) return;
      shownSrcRef.current = src;
      setActive(target);
      layers[outgoing].current?.pause();
    };
    v.addEventListener("playing", onPlaying, { once: true });
    // preload="none" needs an explicit play() to kick off fetching at all.
    v.play().catch(() => {});
    return () => {
      cancelled = true;
      v.removeEventListener("playing", onPlaying);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div ref={containerRef} className={`${ownStyles.wrap} ${className ?? ""}`} aria-label={ariaLabel}>
      {layers.map((ref, i) => (
        <video
          key={i}
          ref={ref}
          src={i === 0 ? initialSrc : undefined}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          className={`${ownStyles.layer} ${i === active ? ownStyles.layerActive : ""}`}
        />
      ))}
    </div>
  );
}
