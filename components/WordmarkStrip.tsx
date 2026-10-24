"use client";
// Entry point for the YUANGONGFU wordmark pattern. Renders on the GPU
// (WordmarkStripGL) and falls back to the CSS/DOM renderer (WordmarkStripDom)
// when WebGL2 is unavailable, the glyph atlas can't be built faithfully, or the
// page is opened with ?strips=dom (handy for A/B comparison).

import { useCallback, useState } from "react";
import WordmarkStripDom, { type Props } from "./WordmarkStripDom";
import WordmarkStripGL from "./WordmarkStripGL";

export default function WordmarkStrip(props: Props) {
  const [useDom, setUseDom] = useState(false);
  const fallBack = useCallback(() => setUseDom(true), []);

  return useDom ? (
    <WordmarkStripDom {...props} />
  ) : (
    <WordmarkStripGL {...props} onUnsupported={fallBack} />
  );
}
