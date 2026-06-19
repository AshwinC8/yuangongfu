"use client";

import { createContext, useContext } from "react";

export type ScrollState = {
  scroll: number;
  velocity: number;
  copyIndex: number;
  localScroll: number;
};

export type ScrollSubscriber = (state: ScrollState) => void;

export type ScrollContextValue = {
  pageHeight: number;
  numCopies: number;
  subscribe: (cb: ScrollSubscriber) => () => void;
  scrollToSection: (id: string) => void;
};

export const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScrollContext(): ScrollContextValue {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useScrollContext must be used inside <InfiniteScrollViewport>");
  return ctx;
}
