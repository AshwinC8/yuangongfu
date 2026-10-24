"use client";

import { useEffect, useRef } from "react";
import { CLASS_BOOKING_URL } from "@/lib/links";
import styles from "./Hero.module.css";

// All four panels share the SAME source clip, each cropped to fill its panel
// (Figma FILL, centered). Swap this path to change the video.
const HERO_VIDEO = "/videos/hero.mp4";
// Still frame painted immediately (the LCP candidate) while the clip buffers.
const HERO_POSTER = "/images/posters/hero.jpg";

const PANELS = [0, 1, 2, 3];
// Each panel's clip starts 0.5s after the previous one (0, 0.5, 1.0, 1.5s).
const STAGGER_MS = 500;
// Pause between the end of one play-through and the start of the next.
const LOOP_DELAY_MS = 2000;
// Only re-seek a clip if it has drifted more than this from where it should be.
// Keeps normal playback seek-free; only corrects after a throttle/scroll stall.
const DRIFT_TOLERANCE_S = 1.0;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // The infinite-scroll track renders three Heroes but only one is ever near the
  // screen, so only that copy gets the clip: 4 videos loaded instead of 12. On an
  // iPad every loaded <video> holds a decoder + buffer even while paused. The
  // others show the poster and drop their src again once they scroll far away.
  // (Registered before the playback effect below so, when both observers fire in
  // the same frame, the src is already set by the time play() is called.)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mobile = window.matchMedia("(max-width: 1300px)");
    let near = false;

    const apply = () => {
      videoRefs.current.forEach((v, i) => {
        if (!v) return;
        // At tablet/mobile widths CSS hides panels 2–4, so they never need the clip.
        const want = near && (i === 0 || !mobile.matches);
        const has = v.hasAttribute("src");
        if (want && !has) {
          v.src = HERO_VIDEO;
        } else if (!want && has) {
          v.removeAttribute("src");
          v.load(); // removing the attribute alone doesn't release the loaded media
        }
      });
    };

    // A full viewport of margin: the clip is fetched well before it's needed
    // (the playback loop below only starts within 200px).
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        apply();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(section);
    mobile.addEventListener("change", apply);

    return () => {
      io.disconnect();
      mobile.removeEventListener("change", apply);
    };
  }, []);

  // Desktop runs the staggered four-panel composition (>1300px, which includes
  // the 12.9"/13" iPad Pro in landscape); tablet/mobile (≤1300px) show only
  // panel 1 (CSS hides 2–4), so there
  // the master clock's per-panel stagger and end-of-clip LOOP_DELAY gap are
  // just dead air. We pick the mode from matchMedia and re-pick on change so
  // a resize swaps behaviour cleanly.
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 1300px)");

    // One master clock drives all four panels. Every frame we compute where each
    // clip *should* be (cycle = clip length + LOOP_DELAY_MS, panel i offset by
    // i * STAGGER_MS) and correct only on real drift, so the 0.5s stagger never
    // collapses into sync. The loop only runs while the hero is on/near screen:
    // the infinite-scroll track renders three Heroes, so pausing the offscreen
    // copies keeps their per-frame seeks/decode from fighting the scroll.
    const setupDesktop = () => {
      let raf = 0;
      let running = false;
      let startMs = 0;
      let clipMs = 0;
      let periodMs = 0;
      // Tracks which panels have a restart seek in flight, so we seek once
      // and wait, rather than re-issuing the seek (and stacking listeners)
      // on every tick while paused and waiting for `seeked` to fire.
      const restarting = [false, false, false, false];

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
              if (v.paused) {
                if (restarting[i]) return; // already seeking; let it resolve
                // (Re)starting playback — including the loop restart after the
                // hold gap. Seek first and wait for the browser to confirm the
                // frame is actually ready (`seeked`) before calling play(),
                // instead of firing both in the same tick. Skipping that wait
                // is what made the restart read as a stutter/flash: play()
                // could fire before frame 0 was decoded, unlike Practice's
                // native `loop`, which the browser always hands off cleanly.
                restarting[i] = true;
                v.currentTime = target;
                v.addEventListener(
                  "seeked",
                  () => {
                    restarting[i] = false;
                    // The panel may have scrolled off-screen (stopLoop) while
                    // this seek was resolving — don't resume playback then.
                    if (running) v.play().catch(() => { });
                  },
                  { once: true },
                );
              } else if (Math.abs(v.currentTime - target) > DRIFT_TOLERANCE_S) {
                // Already playing but drifted (e.g. after a throttled tab) —
                // rare, and the clip is already moving, so a direct seek is
                // fine; waiting here would just add a needless stall.
                v.currentTime = target;
              }
            } else if (!v.paused) {
              // In the delay gap — hold on the last frame.
              v.pause();
            }
          });
        }
        raf = requestAnimationFrame(tick);
      };

      const startLoop = () => {
        if (running) return;
        running = true;
        raf = requestAnimationFrame(tick);
      };
      const stopLoop = () => {
        if (!running) return;
        running = false;
        cancelAnimationFrame(raf);
        videoRefs.current.forEach((v) => {
          if (v && !v.paused) v.pause();
        });
      };

      const first = videoRefs.current[0];
      const begin = () => {
        clipMs = (first?.duration ?? 0) * 1000;
        periodMs = clipMs + LOOP_DELAY_MS;
        startMs = performance.now();
      };
      if (first && first.readyState >= 1 && first.duration) begin();
      else first?.addEventListener("loadedmetadata", begin);

      // Run the scheduler only while this copy is on/near screen. rootMargin gives
      // a head start so the clips are already moving by the time it scrolls in.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) startLoop();
          else stopLoop();
        },
        { rootMargin: "200px 0px" },
      );
      const section = sectionRef.current;
      if (section) io.observe(section);

      return () => {
        io.disconnect();
        cancelAnimationFrame(raf);
        first?.removeEventListener("loadedmetadata", begin);
        videoRefs.current.forEach((v) => {
          if (v && !v.paused) v.pause();
        });
      };
    };

    // Only panel 1 is visible — loop that single clip natively so it plays
    // continuously, with no stagger-in and no pause between play-throughs.
    const setupMobile = () => {
      videoRefs.current.forEach((v, i) => {
        if (v && i !== 0) v.pause();
      });
      const v = videoRefs.current[0];
      if (!v) return () => { };
      v.loop = true;

      // The clip's src is attached lazily (effect above), so on a copy that just
      // scrolled near, play() can run before there is anything to play. Start it
      // again once the metadata arrives.
      let visible = false;
      const onReady = () => {
        if (visible) v.play().catch(() => { });
      };
      v.addEventListener("loadedmetadata", onReady);

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) v.play().catch(() => { });
          else v.pause();
        },
        { rootMargin: "200px 0px" },
      );
      const section = sectionRef.current;
      if (section) io.observe(section);

      return () => {
        io.disconnect();
        v.removeEventListener("loadedmetadata", onReady);
        v.loop = false;
        v.pause();
      };
    };

    let cleanup = mobileQuery.matches ? setupMobile() : setupDesktop();
    const onChange = () => {
      cleanup();
      cleanup = mobileQuery.matches ? setupMobile() : setupDesktop();
    };
    mobileQuery.addEventListener("change", onChange);

    return () => {
      mobileQuery.removeEventListener("change", onChange);
      cleanup();
    };
  }, []);

  return (
    <section ref={sectionRef} data-section="home" className={styles.hero} aria-label="Intro">
      <div className={styles.inner}>
        <div className={styles.panels}>
          {PANELS.map((_, i) => (
            <div className={styles.panel} key={i}>
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                poster={HERO_POSTER}
                muted
                playsInline
                preload="metadata"
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
          <a
            href={CLASS_BOOKING_URL}
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
          >
            book your free consultation
          </a>
        </div>
      </div>
    </section>
  );
}
