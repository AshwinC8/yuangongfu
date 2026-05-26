"use client";
import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type AnimMode = "line" | "word";

export type AnimConfig = {
  enabled:  boolean;
  mode:     AnimMode;
  wghtMin:  number;
  wghtMax:  number;
  spikeDur: number; // seconds for full spike up + down
  stagger:  number; // seconds between each animated group
  rest:     number; // seconds of quiet after full wave
  spread:   number; // 0–1: fraction of cycle each group stays "lit" (controls wave width)
  density:  number; // chars per animated span (1=every char, 2=pairs, 3=triplets…)
};

export const ANIM_DEFAULTS: AnimConfig = {
  enabled:  true,
  mode:     "line",
  wghtMin:  100,
  wghtMax:  900,
  spikeDur: 0.70,
  stagger:  0.10,
  rest:     1.80,
  spread:   0.12, // tight wave — was effectively 0.40 (hardcoded 40% keyframe)
  density:  2,    // pairs of chars share one span → ~half the animated elements
};

type Ctx = { config: AnimConfig; setConfig: React.Dispatch<React.SetStateAction<AnimConfig>> };
const AnimCtx = createContext<Ctx>({ config: ANIM_DEFAULTS, setConfig: () => {} });

export function AnimConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AnimConfig>(ANIM_DEFAULTS);
  return <AnimCtx.Provider value={{ config, setConfig }}>{children}</AnimCtx.Provider>;
}

export function useAnimConfig() {
  return useContext(AnimCtx);
}
