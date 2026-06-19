"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ScrollContext, type ScrollSubscriber, type ScrollState } from "@/lib/scroll-context";

type Props = {
  numCopies?: number;
  /**
   * Smoothing time constant in ms — how long the scroll takes to close ~63%
   * of the gap to its target. Time-based so the feel is identical on a 60 Hz
   * Windows monitor and a 120 Hz MacBook. 120ms matches the old ease=0.13.
   */
  smoothing?: number;
  children: ReactNode;
  /** Rendered on top of the track — use for Navbar and other fixed UI. */
  overlay?: ReactNode;
};

// Nav-click section jumps ease with a gentler time constant than wheel/touch,
// so they glide rather than snap. Manual input keeps the default `smoothing`.
const SECTION_SCROLL_SMOOTHING = 300;

export default function InfiniteScrollViewport({
  numCopies = 3,
  smoothing = 120,
  children,
  overlay,
}: Props) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLDivElement>(null);

  const [pageHeight, setPageHeight] = useState(0);

  // Scroll refs — never in React state to avoid re-renders.
  const currentScroll  = useRef(0);
  const targetScroll   = useRef(0);
  const lastScroll     = useRef(0);
  const velocity       = useRef(0);
  const fling          = useRef(0); // touch momentum, px/ms
  const subscribersRef = useRef<Set<ScrollSubscriber>>(new Set());
  const wakeRef        = useRef<(() => void) | null>(null);
  const activeSmoothing = useRef(smoothing); // wheel/touch default; raised for section jumps

  // Read height synchronously before the browser paints.
  // The state update here triggers a synchronous re-render, so the RAF loop
  // always starts with the correct pageHeight and the wrong position is
  // never painted.
  useLayoutEffect(() => {
    const el = firstCopyRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (h <= 0) return;
    // Start the user at the top of the middle copy.
    currentScroll.current = h;
    targetScroll.current  = h;
    lastScroll.current    = h;
    setPageHeight(h);
    // Apply transform immediately so no wrong position is ever painted.
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(0, ${-h}px, 0)`;
    }
  }, []);

  // Keep pageHeight in sync on window resize / font load / etc.
  useEffect(() => {
    const el = firstCopyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (h <= 0) return;
      setPageHeight(prev => {
        if (prev === h) return prev;
        // Adjust scroll refs proportionally so position doesn't jump.
        const ratio = h / prev;
        currentScroll.current *= ratio;
        targetScroll.current  *= ratio;
        lastScroll.current    *= ratio;
        return h;
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const subscribe = useCallback((cb: ScrollSubscriber) => {
    subscribersRef.current.add(cb);
    return () => subscribersRef.current.delete(cb);
  }, []);

  // Jump to a [data-section] element in whichever copy is currently on screen.
  const scrollToSection = useCallback((id: string) => {
    const copy = firstCopyRef.current;
    if (!copy || pageHeight === 0) return;
    const el = copy.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if (!el) return;
    // Both rects ride the same track transform, so their difference is the
    // section's pure layout offset within one copy.
    const offset = el.getBoundingClientRect().top - copy.getBoundingClientRect().top;
    const navH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--nav-height"),
    ) || 0;
    const base = offset - navH;
    // Land on the nearest copy so a click never scrolls a whole page out of view.
    const target = base + Math.round((currentScroll.current - base) / pageHeight) * pageHeight;
    activeSmoothing.current = SECTION_SCROLL_SMOOTHING; // glide gently to the section
    targetScroll.current = target;
    fling.current = 0;
    wakeRef.current?.();
  }, [pageHeight]);

  const contextValue = useMemo(
    () => ({ pageHeight, numCopies, subscribe, scrollToSection }),
    [pageHeight, numCopies, subscribe, scrollToSection],
  );

  useEffect(() => {
    if (pageHeight === 0) return; // wait for first measurement
    const wrap  = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId   = 0;
    let running = false;
    let lastT   = -1;

    // The loop only runs while there's distance left to cover; it stops when
    // scroll settles and any input wakes it. Idle cost: zero.
    function wake() {
      if (running) return;
      running = true;
      lastT   = -1;
      rafId   = requestAnimationFrame(tick);
    }
    wakeRef.current = wake;

    function tick(now: number) {
      const dt = lastT < 0 ? 16.7 : Math.min(64, now - lastT); // clamp tab-switch gaps
      lastT = now;

      const cs = currentScroll;
      const ts = targetScroll;

      // Touch momentum — decays like a native iOS fling.
      if (fling.current !== 0) {
        ts.current += fling.current * dt;
        fling.current *= Math.exp(-dt / 500);
        if (Math.abs(fling.current) < 0.005) fling.current = 0;
      }

      // Framerate-independent exponential smoothing: same feel at any Hz.
      const k = reduced ? 1 : 1 - Math.exp(-dt / activeSmoothing.current);
      cs.current += (ts.current - cs.current) * k;

      const settled = fling.current === 0 && Math.abs(ts.current - cs.current) < 0.05;
      if (settled) cs.current = ts.current; // snap the sub-pixel remainder

      // Teleport — keep within [0.5 × pageHeight, 1.5 × pageHeight].
      // Shift both refs to preserve momentum across the seam.
      while (cs.current < pageHeight * 0.5) {
        cs.current         += pageHeight;
        ts.current         += pageHeight;
        lastScroll.current += pageHeight;
      }
      while (cs.current >= pageHeight * 1.5) {
        cs.current         -= pageHeight;
        ts.current         -= pageHeight;
        lastScroll.current -= pageHeight;
      }

      // Velocity in px per 60Hz-frame, independent of actual refresh rate.
      const rawV = (cs.current - lastScroll.current) * (16.7 / dt);
      lastScroll.current = cs.current;
      const vAlpha = 1 - Math.exp(-dt / 100);
      velocity.current = settled ? 0 : velocity.current + (rawV - velocity.current) * vAlpha;

      // Snap to device pixels — fractional offsets force the GPU to resample
      // the whole visible layer every frame and make text shimmer.
      const dpr = window.devicePixelRatio || 1;
      const y   = Math.round(cs.current * dpr) / dpr;
      track!.style.transform = `translate3d(0, ${-y}px, 0)`;

      const localScroll = ((cs.current % pageHeight) + pageHeight) % pageHeight;
      const copyIndex   = Math.floor(cs.current / pageHeight);

      const state: ScrollState = {
        scroll: cs.current,
        velocity: velocity.current,
        copyIndex,
        localScroll,
      };

      subscribersRef.current.forEach(cb => cb(state));

      if (settled) { activeSmoothing.current = smoothing; running = false; return; }
      rafId = requestAnimationFrame(tick);
    }

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) return; // pinch-zoom gesture on precision touchpads — don't hijack
      e.preventDefault();
      let dy = e.deltaY;
      if      (e.deltaMode === 1) dy *= 16;                 // lines → px (Firefox wheel)
      else if (e.deltaMode === 2) dy *= window.innerHeight; // pages → px
      dy = Math.max(-500, Math.min(500, dy));               // tame driver spikes
      targetScroll.current += dy;
      fling.current = 0; // wheel input cancels any touch momentum
      activeSmoothing.current = smoothing; // manual scroll overrides a section glide
      wake();
    }

    // Touch: drag maps 1.5× to scroll; on release the smoothed finger
    // velocity becomes a decaying fling so flicks feel native on iOS.
    let touchY: number | null = null;
    let touchV = 0; // px/ms, smoothed
    let touchT = 0;

    function onTouchStart(e: TouchEvent) {
      touchY = e.touches[0].clientY;
      touchV = 0;
      touchT = e.timeStamp;
      fling.current = 0; // grabbing the page stops the current fling
      activeSmoothing.current = smoothing; // manual scroll overrides a section glide
    }
    function onTouchMove(e: TouchEvent) {
      if (touchY === null) return;
      e.preventDefault();
      const newY = e.touches[0].clientY;
      const dy   = (touchY - newY) * 1.5;
      const dt   = Math.max(1, e.timeStamp - touchT);
      targetScroll.current += dy;
      touchV = touchV * 0.7 + (dy / dt) * 0.3;
      touchY = newY;
      touchT = e.timeStamp;
      wake();
    }
    function onTouchEnd(e: TouchEvent) {
      touchY = null;
      // Fling only if the finger was still moving when it lifted.
      if (!reduced && e.timeStamp - touchT < 80) fling.current = touchV;
      touchV = 0;
      wake();
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;

      const page = window.innerHeight * 0.9;
      let dy = 0;
      switch (e.key) {
        case "ArrowDown": dy = 80;    break;
        case "ArrowUp":   dy = -80;   break;
        case "PageDown":  dy = page;  break;
        case "PageUp":    dy = -page; break;
        case " ":         dy = e.shiftKey ? -page : page; break;
        default: return;
      }
      e.preventDefault();
      fling.current = 0;
      activeSmoothing.current = smoothing; // manual scroll overrides a section glide
      targetScroll.current += dy;
      wake();
    }

    wrap.addEventListener("wheel",      onWheel,      { passive: false });
    wrap.addEventListener("touchstart", onTouchStart, { passive: true  });
    wrap.addEventListener("touchmove",  onTouchMove,  { passive: false });
    wrap.addEventListener("touchend",   onTouchEnd);
    window.addEventListener("keydown",  onKey);

    wake(); // one pass to paint the measured position, then it idles

    return () => {
      running = false;
      wakeRef.current = null;
      cancelAnimationFrame(rafId);
      wrap.removeEventListener("wheel",      onWheel);
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove",  onTouchMove);
      wrap.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("keydown",  onKey);
    };
  }, [pageHeight, smoothing]);

  return (
    <ScrollContext.Provider value={contextValue}>
      <div
        ref={wrapRef}
        style={{ position: "fixed", inset: 0, overflow: "hidden", background: "var(--color-bg)" }}
      >
        {/* Flexbox column — copies stack with zero gap regardless of height estimate. */}
        <div ref={trackRef} style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", flexDirection: "column" }}>
          {Array.from({ length: numCopies }).map((_, i) => (
            <div key={i} ref={i === 0 ? firstCopyRef : undefined}>
              {children}
            </div>
          ))}
        </div>
        {overlay}
      </div>
    </ScrollContext.Provider>
  );
}
