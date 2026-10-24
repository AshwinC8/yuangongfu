"use client";
// WebGL renderer for the wordmark strip — same pattern and props as
// WordmarkStripDom, drawn on the GPU instead of animating thousands of spans.
// Geometry, timing and the GL work live in lib/wordmark-gl; this component only
// owns the DOM (container → flow wrapper → canvas) and forwards size + config.

import { useEffect, useRef } from "react";
import { useAnimConfig } from "./AnimConfigContext";
import { getWordmarkEngine, type StripHandle } from "@/lib/wordmark-gl/engine";
import type { Props } from "./WordmarkStripDom";

type GLProps = Props & {
  /** WebGL can't be used (or the atlas failed): the parent swaps in the DOM renderer. */
  onUnsupported: () => void;
};

export default function WordmarkStripGL({
  width = "100%",
  height,
  fontSize = 32,
  className,
  onUnsupported,
}: GLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<StripHandle | null>(null);
  const { config } = useAnimConfig();

  // Effects run in order, so by the time the config effect below fires on
  // mount, this one has already created the handle.
  useEffect(() => {
    const container = containerRef.current;
    const flow = flowRef.current;
    const canvas = canvasRef.current;
    if (!container || !flow || !canvas) return;

    const engine = getWordmarkEngine();
    if (!engine) {
      onUnsupported();
      return;
    }

    const handle = engine.createStrip({ container, flow, canvas, onFail: onUnsupported });
    handleRef.current = handle;

    const ro = new ResizeObserver(([entry]) => {
      handle.update({ size: { w: entry.contentRect.width, h: entry.contentRect.height } });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, [onUnsupported]);

  useEffect(() => {
    handleRef.current?.update({ fontSize, params: config });
  }, [fontSize, config]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-renderer="gl"
      className={className}
      style={{
        contain: "layout style paint",
        width,
        ...(height !== undefined && { height }),
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Height is set by the engine to match what the DOM renderer's stacked
          rows would occupy, so a stretched grid item sizes identically. The
          canvas is out of flow inside it. */}
      <div ref={flowRef} style={{ position: "relative", width: "100%", flex: "none", height: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", left: 0, top: 0, display: "block", width: 0, height: 0 }}
        />
      </div>
    </div>
  );
}
