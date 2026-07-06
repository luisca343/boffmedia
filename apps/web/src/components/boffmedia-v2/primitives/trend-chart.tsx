"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TrendLine {
  values: number[]
  color: string
  width?: number
  dashed?: boolean
  opacity?: number
}

interface TrendChartProps {
  lines?: TrendLine[]
  baseline?: number
  dots?: (string | null | undefined)[]
  height?: number
  pad?: number
  yPad?: number
  className?: string
}

export function TrendChart({
  lines = [],
  baseline,
  dots,
  height = 150,
  pad = 10,
  yPad = 0.08,
  className,
}: TrendChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const all = lines.flatMap((l) => l.values).concat(baseline != null ? [baseline] : [])
  const hasData = all.length > 0 && w > 0
  let lo = Math.min(...all)
  let hi = Math.max(...all)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const span = hi - lo || 1
  lo -= span * yPad
  hi += span * yPad
  const innerW = Math.max(1, w - pad * 2)
  const innerH = height - pad * 2
  const xAt = (i: number, n: number) => pad + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => pad + innerH - ((v - lo) / (hi - lo)) * innerH

  return (
    <div ref={ref} className={cn("w-full", className)} style={{ height }}>
      {hasData && (
        <svg width={w} height={height} className="block w-full overflow-visible">
          {baseline != null && (
            <line
              x1={pad}
              x2={w - pad}
              y1={yAt(baseline)}
              y2={yAt(baseline)}
              stroke="var(--border-strong)"
              strokeDasharray="3 4"
            />
          )}
          {lines.map((l, li) => {
            const n = l.values.length
            if (!n) return null
            const d = l.values
              .map((v, i) => (i ? "L" : "M") + xAt(i, n).toFixed(1) + " " + yAt(v).toFixed(1))
              .join(" ")
            return (
              <path
                key={li}
                d={d}
                fill="none"
                stroke={l.color || "var(--secondary)"}
                strokeWidth={l.width || 2}
                strokeDasharray={l.dashed ? "5 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={l.opacity != null ? l.opacity : 1}
              />
            )
          })}
          {dots &&
            lines[0] &&
            lines[0].values.map((v, i) => {
              const n = lines[0].values.length
              const tone = dots[i]
              const c = tone === "win" ? "var(--trk-win)" : tone === "loss" ? "var(--trk-loss)" : tone === "draw" ? "var(--trk-draw)" : "var(--text-dim)"
              return (
                <circle
                  key={i}
                  cx={xAt(i, n)}
                  cy={yAt(v)}
                  r={3}
                  fill={c}
                  stroke="var(--layer-1)"
                  strokeWidth={1}
                />
              )
            })}
        </svg>
      )}
    </div>
  )
}
