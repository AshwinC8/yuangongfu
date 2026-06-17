"use client";
// Pattern: YUANGONGFU repeated, then same row rotated 180° directly below.
// Each successive pair shifts left by one character width.
// Animation is CSS-driven — ThrobKeyframe owns the @keyframes, each strip sets its own --wm-dur.

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./WordmarkStrip.module.css";
import { useAnimConfig } from "./AnimConfigContext";
import About from "./About";

type Props = {
  width?: number | string;
  height?: number | string; // omit to let a CSS class control height
  fontSize?: number;
  className?: string;
  section?: string;
};

const WORD = "YUANGONGFU";
const ROW_GAP = 3;

export default function WordmarkStrip({
  width = "100%",
  height,
  fontSize = 32,
  className,
  section = "default"
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // null until the ResizeObserver fires — avoids an initial wrong-size render
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const { config } = useAnimConfig();

  // No visibility pause: strips animate continuously. An IntersectionObserver
  // pause was removed — its callback lags behind fast scrolls, so strips
  // arrived visibly frozen. Stepped keyframes keep always-on affordable.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ROW_H = fontSize;
  const CHAR_W = Math.round(fontSize * 0.72);
  const pairH = (ROW_H + ROW_GAP) * 2;

  // Derive row geometry only once the container is measured
  const { numPairs, rowText, stripDur } = useMemo(() => {
    if (!size) return { numPairs: 0, rowText: "", stripDur: 3.4 };

    const numPairs = Math.ceil(size.h / pairH) + 4;
    if (section && section === "About") {
      console.log(section);
      console.log(size.h / pairH);
    }
    const maxShift = numPairs * CHAR_W;
    const wordW = CHAR_W * WORD.length;
    const wordsPerRow = Math.ceil((size.w + maxShift) / wordW) + 3;
    const rowText = Array.from({ length: wordsPerRow }, () => WORD).join("");

    // Each strip owns its cycle length:
    //   word mode → always 9-position stagger (one YUANGONGFU)
    //   line mode → stagger * group count, so wider strips take longer → natural drift
    // maxPos is in groups (density chars each), matching renderRow's per-group delays.
    const d = Math.max(1, Math.round(config.density));
    const numGroups = Math.ceil(rowText.length / d);
    const maxPos = config.mode === "line" ? numGroups - 1 : Math.ceil(9 / d);
    const stripDur = config.spikeDur + config.rest + config.stagger * maxPos;

    return { numPairs, rowText, stripDur };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, config, pairH, CHAR_W]);

  const rowStyle: React.CSSProperties = {
    display: "block",
    margin: 0,
    padding: 0,
    whiteSpace: "nowrap",
    fontFamily: "var(--font-display)",
    fontSize,
    letterSpacing: "0.02em",
    lineHeight: `${ROW_H}px`,
    height: ROW_H,
    color: "#000",
  };

  // word: delay repeats every 10 chars → each YUANGONGFU pulses independently.
  // line: delay is absolute position → one wave travels the full row left to right.
  // density: N chars share one span → reduces animated element count by Nx.
  function renderRow(shift: number) {
    const isLine = config.mode === "line";
    const d = Math.max(1, Math.round(config.density));
    const enabled = config.enabled;
    const spans: React.ReactNode[] = [];

    // Chars past this row's clip window (strip width + its shift) can never be
    // seen — stop rendering there instead of animating invisible glyphs.
    // One extra word absorbs the CHAR_W estimate vs. real glyph advances.
    // Delays still use absolute i, so the wave is identical to the full row.
    const maxChars = Math.min(
      rowText.length,
      Math.ceil(((size?.w ?? 0) + shift) / CHAR_W) + WORD.length
    );

    for (let i = 0; i < maxChars; i += d) {
      const text = rowText.slice(i, i + d);
      // Use the first char's position for the whole group's delay
      const pos = isLine ? i : (i % WORD.length);
      spans.push(
        <span
          key={i}
          className={enabled ? styles.ch : undefined}
          style={enabled ? { "--wm-char-delay": `${(pos * config.stagger).toFixed(3)}s` } as React.CSSProperties : undefined}
        >
          {text}
        </span>
      );
    }

    return (
      <div style={{ ...rowStyle, transform: `translateX(-${shift}px)` }}>
        {spans}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        // --wm-dur overrides the global fallback for this strip specifically
        "--wm-dur": `${stripDur}s`,
        contain: "layout style paint",
        // Off-screen strips (incl. the 2 invisible page copies — 18 strips
        // total!) skip layout+paint entirely. Unlike an observer-based pause
        // this is engine-managed per frame, and the animation clock is global,
        // so strips scroll into view mid-animation — never visibly frozen.
        contentVisibility: "auto",
        // Own compositor layer: strip repaints (weight bucket jumps) must not
        // dirty the scrolling track's tiles, or we re-raster the moving layer
        // mid-scroll. Isolated here, the track stays a pure GPU slide.
        willChange: "transform",
        width,
        ...(height !== undefined && { height }),
        overflow: "hidden",
        flexShrink: 0,
      } as React.CSSProperties}
    >
      {size && Array.from({ length: numPairs }, (_, i) => {
        const shift = i * CHAR_W;
        const row = renderRow(shift); // same element tree for both copies
        return (
          <div key={i} style={{ marginBottom: -10, padding: 0 }}>
            <div style={{ overflow: "hidden", height: ROW_H, marginBottom: -5, padding: 0 }}>
              {row}
            </div>
            {/* scaleY(-1) mirrors vertically — each letter sits directly below its counterpart */}
            <div style={{ overflow: "hidden", height: ROW_H, transform: "scaleY(-1)", marginBottom: -5, padding: 0 }}>
              {row}
            </div>
          </div>
        );
      })}
    </div>
  );
}
