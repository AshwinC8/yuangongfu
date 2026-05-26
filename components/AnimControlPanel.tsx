"use client";
import { useState } from "react";
import { useAnimConfig, ANIM_DEFAULTS } from "./AnimConfigContext";
import type { AnimConfig, AnimMode } from "./AnimConfigContext";
import styles from "./AnimControlPanel.module.css";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
};

function Slider({ label, value, min, max, step, fmt, onChange }: SliderProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <input
        type="range"
        className={styles.slider}
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <span className={styles.val}>{fmt(value)}</span>
    </div>
  );
}

export default function AnimControlPanel() {
  const [open, setOpen] = useState(false);
  const { config, setConfig } = useAnimConfig();

  function set<K extends keyof AnimConfig>(key: K, val: AnimConfig[K]) {
    setConfig(c => ({ ...c, [key]: val }));
  }

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>Animation</span>
            <button className={styles.close} onClick={() => setOpen(false)}>×</button>
          </div>

          <div className={styles.modeRow}>
            <button
              className={`${styles.modeBtn} ${styles.modeBtnFull} ${config.enabled ? styles.modeBtnActive : ""}`}
              onClick={() => set("enabled", !config.enabled)}
            >
              {config.enabled ? "Animation ON" : "Animation OFF"}
            </button>
          </div>

          <div className={styles.modeRow}>
            {(["word", "line"] as AnimMode[]).map(m => (
              <button
                key={m}
                className={`${styles.modeBtn} ${config.mode === m ? styles.modeBtnActive : ""}`}
                onClick={() => {
                  // Scale stagger so sweep speed stays visually comparable:
                  // word uses 10 positions, line uses ~120 — scale by that ratio.
                  const SCALE = 12;
                  setConfig(c => ({
                    ...c,
                    mode: m,
                    stagger: m === "line"
                      ? parseFloat((c.stagger / SCALE).toFixed(3))
                      : parseFloat((c.stagger * SCALE).toFixed(3)),
                  }));
                }}
              >
                {m === "word" ? "Word" : "Line"}
              </button>
            ))}
          </div>

          <Slider
            label="Wght min"
            value={config.wghtMin} min={100} max={400} step={10}
            fmt={v => String(v)}
            onChange={v => set("wghtMin", v)}
          />
          <Slider
            label="Wght max"
            value={config.wghtMax} min={400} max={900} step={10}
            fmt={v => String(v)}
            onChange={v => set("wghtMax", v)}
          />
          <Slider
            label="Wave width"
            value={config.spread} min={0.03} max={0.60} step={0.01}
            fmt={v => Math.round(v * 100) + "%"}
            onChange={v => set("spread", v)}
          />
          <Slider
            label="Density"
            value={config.density} min={1} max={6} step={1}
            fmt={v => `${v}ch`}
            onChange={v => set("density", v)}
          />
          <Slider
            label="Spike"
            value={config.spikeDur} min={0.1} max={2.0} step={0.05}
            fmt={v => v.toFixed(2) + "s"}
            onChange={v => set("spikeDur", v)}
          />
          <Slider
            label="Stagger"
            value={config.stagger}
            min={config.mode === "line" ? 0.001 : 0.01}
            max={config.mode === "line" ? 0.03  : 0.3}
            step={config.mode === "line" ? 0.001 : 0.01}
            fmt={v => v.toFixed(3) + "s"}
            onChange={v => set("stagger", v)}
          />
          <Slider
            label="Rest"
            value={config.rest} min={0} max={5} step={0.1}
            fmt={v => v.toFixed(1) + "s"}
            onChange={v => set("rest", v)}
          />

          <div className={styles.footer}>
            <button className={styles.reset} onClick={() => setConfig(ANIM_DEFAULTS)}>
              Reset
            </button>
          </div>
        </div>
      )}

      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        {open ? "✕ close" : "⚡ anim"}
      </button>
    </div>
  );
}
