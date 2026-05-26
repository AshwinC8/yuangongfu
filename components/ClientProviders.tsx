"use client";
import type { ReactNode } from "react";
import { AnimConfigProvider } from "./AnimConfigContext";
import AnimControlPanel from "./AnimControlPanel";
import ThrobKeyframe from "./ThrobKeyframe";
import ScrollPause from "./ScrollPause";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AnimConfigProvider>
      <ThrobKeyframe />
      <ScrollPause />
      {children}
      <AnimControlPanel />
    </AnimConfigProvider>
  );
}
