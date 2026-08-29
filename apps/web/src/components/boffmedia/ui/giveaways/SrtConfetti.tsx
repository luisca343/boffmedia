"use client"

import * as React from "react"
import { SRT_COLORS } from "./draw-util"

export interface SrtConfettiProps {
  n?: number
}

export function SrtConfetti({ n = 54 }: SrtConfettiProps) {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: n }).map((_, i) => ({
        left: (i * 97) % 100,
        delay: (((i * 53) % 100) / 100) * 0.6,
        dur: 2.4 + (((i * 31) % 100) / 100) * 1.8,
        color: SRT_COLORS[i % SRT_COLORS.length],
        w: 6 + (i % 3) * 2,
      })),
    [n],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-3 animate-[bm-srt-conf_linear_forwards] motion-reduce:animate-none"
          style={{ left: p.left + "%", width: p.w, height: p.w * 1.5, background: p.color, animationDuration: p.dur + "s", animationDelay: p.delay + "s" }}
        />
      ))}
    </div>
  )
}
