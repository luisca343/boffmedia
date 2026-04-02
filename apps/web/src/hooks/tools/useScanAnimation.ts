"use client";

import { useState, useEffect } from "react";

/**
 * Drives the animated horizontal scan-line effect used on neon tool cards.
 * Returns the current vertical position (0–100%) of the scan line.
 * The animation only runs while `isHovered` is true.
 */
export function useScanAnimation(isHovered: boolean, duration = 1400): number {
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!isHovered) return;

    let raf: number;
    let start: number | null = null;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % duration;
      setScanY((elapsed / duration) * 100);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isHovered, duration]);

  return scanY;
}
