"use client";
import type { ReactNode } from "react";
import { AnimConfigProvider } from "./AnimConfigContext";
import ThrobKeyframe from "./ThrobKeyframe";
import PerfMeter from "./PerfMeter";
import VideoPreloader from "./VideoPreloader";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AnimConfigProvider>
      <ThrobKeyframe />
      <PerfMeter />
      <VideoPreloader />
      {children}
    </AnimConfigProvider>
  );
}
