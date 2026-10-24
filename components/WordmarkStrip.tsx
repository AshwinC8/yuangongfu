"use client";
// Entry point for the YUANGONGFU wordmark pattern. Laptops render it on the GPU
// (WordmarkStripGL); touch tablets and phones use the CSS/DOM renderer
// (WordmarkStripDom) by default — see lib/device.ts. The CSS renderer is also the
// fallback when WebGL2 is unavailable or the glyph atlas can't be built faithfully.
// ?strips=dom / ?strips=gl force either renderer on any device (handy for A/B).

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
