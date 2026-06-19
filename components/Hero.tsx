"use client";

import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

// All four panels share the SAME source clip, each cropped to fill its panel
// (Figma FILL, centered). Swap this path to change the video.
const HERO_VIDEO = "/videos/hero%20section%20test.mp4";

const PANELS = [0, 1, 2, 3];
// Each panel's clip starts 0.5s after the previous one (0, 0.5, 1.0, 1.5s).
const STAGGER_MS = 500;
// Pause between the end of one play-through and the start of the next.
const LOOP_DELAY_MS = 2000;
// Only re-seek a clip if it has drifted more than this from where it should be.
// Keeps normal playback seek-free; only corrects after a throttle/scroll stall.
const DRIFT_TOLERANCE_S = 0.3;

export default function Hero() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // One master clock drives all four panels. Every frame we compute where each
  // clip *should* be (cycle = clip length + LOOP_DELAY_MS, panel i offset by
  // i * STAGGER_MS) and correct only on real drift. Because the schedule is
  // re-derived from performance.now() each frame, it self-heals after the
  // browser throttles timers/video on background-tab or scroll — the 0.5s
  // stagger can no longer collapse into sync.
  useEffect(() => {
    let raf = 0;
    let startMs = 0;
    let clipMs = 0;
    let periodMs = 0;

    const tick = () => {
      if (clipMs > 0) {
        const elapsed = performance.now() - startMs;
        videoRefs.current.forEach((v, i) => {
          if (!v) return;
          const phase = elapsed - i * STAGGER_MS;
          if (phase < 0) {
            // Not its turn yet — hold on the first frame.
            if (!v.paused) v.pause();
            return;
          }
          const t = phase % periodMs;
          if (t < clipMs) {
            const target = t / 1000;
            if (Math.abs(v.currentTime - target) > DRIFT_TOLERANCE_S) {
              v.currentTime = target;
            }
            if (v.paused) v.play().catch(() => {});
          } else if (!v.paused) {
            // In the delay gap — hold on the last frame.
            v.pause();
          }
        });
      }
      raf = requestAnimationFrame(tick);
    };

    const first = videoRefs.current[0];
    const begin = () => {
      clipMs = (first?.duration ?? 0) * 1000;
      periodMs = clipMs + LOOP_DELAY_MS;
      startMs = performance.now();
    };
    if (first && first.readyState >= 1 && first.duration) begin();
    else first?.addEventListener("loadedmetadata", begin);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      first?.removeEventListener("loadedmetadata", begin);
    };
  }, []);

  return (
    <section className={styles.hero} aria-label="Intro">
      <div className={styles.inner}>
        <div className={styles.panels}>
          {PANELS.map((_, i) => (
            <div className={styles.panel} key={i}>
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={HERO_VIDEO}
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        <div className={styles.copy}>
          <h1 className={styles.heading}>
            POWER BEGINS
            <br />
            IN STILLNESS
          </h1>
          <p className={styles.body}>
            Ancient wisdom embodied in the modern world.
            <br />
            Step onto a path that quiets the mind,
            <br />
            harmonizes the body, and
            <br />
            reveals the self.
          </p>
          <a href="#book" className={styles.cta}>
            book your free consultation
          </a>
        </div>
      </div>
    </section>
  );
}
