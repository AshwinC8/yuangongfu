"use client";
import { useEffect, useRef } from "react";
import { useAnimConfig } from "./AnimConfigContext";

type Props = {
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
};

const LETTERS = [..."YUANGONGFU"];

export default function ThrobWord({ fontSize = 48, className, style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { config } = useAnimConfig();

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { wghtMin, wghtMax, spikeDur, stagger, rest } = config;
    const totalS = spikeDur + rest + stagger * (LETTERS.length - 1);
    const peakOffset     = (spikeDur / 2) / totalS;
    const spikeEndOffset = spikeDur / totalS;

    const spans = el.querySelectorAll<HTMLElement>("[data-pos]");
    const anims: Animation[] = [];

    spans.forEach(s => {
      const pos = Number(s.dataset.pos);
      anims.push(
        s.animate(
          [
            { fontVariationSettings: `'wght' ${wghtMin}`, easing: "ease-in-out", offset: 0 },
            { fontVariationSettings: `'wght' ${wghtMax}`, easing: "ease-in-out", offset: peakOffset },
            { fontVariationSettings: `'wght' ${wghtMin}`, easing: "linear",      offset: spikeEndOffset },
            { fontVariationSettings: `'wght' ${wghtMin}`,                         offset: 1 },
          ],
          {
            duration: totalS * 1000,
            delay: pos * stagger * 1000,
            iterations: Infinity,
            fill: "backwards",
          }
        )
      );
    });

    return () => anims.forEach(a => a.cancel());
  }, [config]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        fontFamily: "var(--font-display)",
        fontSize,
        letterSpacing: "0.04em",
        display: "inline-block",
        ...style,
      }}
    >
      {LETTERS.map((ch, i) => (
        <span key={i} data-pos={i} style={{ display: "inline" }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
