/**
 * Window width + a plain "fits in the window" canvas width.
 *
 * The battle no longer sizes itself from this — `BattleCanvas` measures its own
 * box (see `lib/battle-layout.tsx`). The hook remains for the replay player,
 * which uses it to bound its log height, and it no longer reads
 * `window.screen.width` (the physical monitor, not the window).
 */

import { useState, useEffect } from "react";

const MAX_CANVAS = 1152;

export function useViewportWidth(): [number, number] {
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const canvasWidth = Math.max(280, Math.min(MAX_CANVAS, viewportWidth - 32));
  return [viewportWidth, canvasWidth];
}
