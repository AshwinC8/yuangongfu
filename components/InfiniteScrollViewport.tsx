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
  /** Smoothing factor (0..1). Higher = snappier. */
  ease?: number;
  children: ReactNode;
  /** Rendered on top of the track — use for Navbar and other fixed UI. */
  overlay?: ReactNode;
};

export default function InfiniteScrollViewport({
  numCopies = 3,
  ease = 0.13,
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
  const subscribersRef = useRef<Set<ScrollSubscriber>>(new Set());

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

  const contextValue = useMemo(
    () => ({ pageHeight, numCopies, subscribe }),
    [pageHeight, numCopies, subscribe],
  );

  useEffect(() => {
    if (pageHeight === 0) return; // wait for first measurement
    const wrap  = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    let rafId = 0;

    function tick() {
      const cs = currentScroll;
      const ts = targetScroll;

      cs.current += (ts.current - cs.current) * ease;

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

      const rawV = cs.current - lastScroll.current;
      lastScroll.current = cs.current;
      velocity.current   = velocity.current * 0.85 + rawV * 0.15;

      track!.style.transform = `translate3d(0, ${-cs.current}px, 0)`;

      const localScroll = ((cs.current % pageHeight) + pageHeight) % pageHeight;
      const copyIndex   = Math.floor(cs.current / pageHeight);

      const state: ScrollState = {
        scroll: cs.current,
        velocity: velocity.current,
        copyIndex,
        localScroll,
      };

      subscribersRef.current.forEach(cb => cb(state));
      rafId = requestAnimationFrame(tick);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      targetScroll.current += e.deltaY;
    }

    let touchY: number | null = null;
    function onTouchStart(e: TouchEvent) { touchY = e.touches[0].clientY; }
    function onTouchMove(e: TouchEvent) {
      if (touchY === null) return;
      e.preventDefault();
      const newY = e.touches[0].clientY;
      targetScroll.current += (touchY - newY) * 1.5;
      touchY = newY;
    }
    function onTouchEnd() { touchY = null; }

    wrap.addEventListener("wheel",      onWheel,      { passive: false });
    wrap.addEventListener("touchstart", onTouchStart, { passive: true  });
    wrap.addEventListener("touchmove",  onTouchMove,  { passive: false });
    wrap.addEventListener("touchend",   onTouchEnd);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      wrap.removeEventListener("wheel",      onWheel);
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove",  onTouchMove);
      wrap.removeEventListener("touchend",   onTouchEnd);
    };
  }, [pageHeight, ease]);

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
