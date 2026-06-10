"use client";
import type { ReactNode } from "react";
import { AnimConfigProvider } from "./AnimConfigContext";
import AnimControlPanel from "./AnimControlPanel";
import ThrobKeyframe from "./ThrobKeyframe";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AnimConfigProvider>
      <ThrobKeyframe />
      {children}
      <AnimControlPanel />
    </AnimConfigProvider>
  );
}
