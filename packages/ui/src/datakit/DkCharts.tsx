"use client"

import * as React from "react"
import { useNsT } from "../i18n"
import { cn } from "../cn"
import { cssVars } from "./utils"

function useElementWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [width, setWidth] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

const DOT_COLOR: Record<string, string> = {
  win: "var(--ok)",
  loss: "var(--bad)",
  draw: "var(--warn)",
}

export interface DkTrendLine {
  values: (number | null)[]
  color?: string
  width?: number
  /** Per-point tags (e.g. match result) → dot color; omit to hide dots. */
  dots?: (string | undefined)[]
}

export interface DkTrendProps {
  lines: DkTrendLine[]
  baseline?: number
  height?: number
  className?: string
  ariaLabel?: string
}

/** Responsive progression chart: one or more lines + optional dashed baseline. */
export function DkTrend({ lines, baseline, height = 170, className, ariaLabel }: DkTrendProps) {
  const t = useNsT("common.dkExtras")
  const label = ariaLabel ?? t("trendAria")
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const padX = 8
  const padY = 12

  const nums: number[] = []
  for (const l of lines) for (const v of l.values) if (v != null) nums.push(v)
  if (baseline != null) nums.push(baseline)
  let min = nums.length ? Math.min(...nums) : 0
  let max = nums.length ? Math.max(...nums) : 1
  if (min === max) { min -= 1; max += 1 }

  const innerW = Math.max(0, width - padX * 2)
  const innerH = height - padY * 2
  const n = Math.max(1, ...lines.map((l) => l.values.length))
  const xAt = (i: number) => padX + (n > 1 ? i / (n - 1) : 0.5) * innerW
  const yAt = (v: number) => padY + (1 - (v - min) / (max - min)) * innerH

  const pathOf = (values: (number | null)[]) => {
    let d = ""
    let pen = false
    values.forEach((v, i) => {
      if (v == null) { pen = false; return }
      d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)} `
      pen = true
    })
    return d
  }

  return (
    <div ref={ref} className={cn("w-full border border-solid border-line bg-base", className)}>
      {width > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
          {baseline != null && (
            <line
              x1={padX}
              x2={width - padX}
              y1={yAt(baseline)}
              y2={yAt(baseline)}
              className="stroke-txt-dim opacity-60"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
          )}
          {lines.map((l, li) => {
            const d = pathOf(l.values)
            const color = l.color ?? "var(--accent)"
            return (
              <g key={li}>
                {d && <path d={d} fill="none" stroke={color} strokeWidth={l.width ?? 2} strokeLinejoin="round" strokeLinecap="round" />}
                {l.dots &&
                  l.values.map((v, i) =>
                    v == null ? null : <circle key={i} cx={xAt(i)} cy={yAt(v)} r={3} fill={DOT_COLOR[l.dots?.[i] ?? ""] ?? color} />,
                  )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

export interface DkHeatProps {
  rows: string[]
  cols: string[]
  max: number
  value: (rowIndex: number, colIndex: number) => number
  className?: string
}

/** Compact activity heatmap: row labels + a grid of accent-tinted cells. */
export function DkHeat({ rows, cols, max, value, className }: DkHeatProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className="grid items-center gap-[3px]"
        style={cssVars({ "grid-template-columns": `auto repeat(${cols.length}, minmax(22px,1fr))` })}
      >
        <span />
        {cols.map((c) => (
          <span key={c} className="text-center font-mono text-[8px] leading-none text-txt-dim">{c}</span>
        ))}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <span className="pr-[6px] font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-dim">{r}</span>
            {cols.map((c, ci) => {
              const v = value(ri, ci)
              const intensity = max > 0 ? v / max : 0
              const bg = v === 0 ? "var(--panel)" : `color-mix(in srgb, var(--accent) ${Math.round(18 + intensity * 72)}%, transparent)`
              return (
                <span
                  key={c}
                  title={`${r} · ${c}: ${v}`}
                  style={{ background: bg }}
                  className="block aspect-square min-w-[10px] border border-solid border-line"
                />
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
