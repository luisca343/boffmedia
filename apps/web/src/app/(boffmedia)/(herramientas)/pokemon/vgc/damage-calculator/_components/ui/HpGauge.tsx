"use client"

import { cn } from "@/lib/utils"
import { INPUT_CLASS } from "./controls"

export interface HpGaugeProps {
  current: number
  max: number
  label: string
  resetLabel?: string
  onChange?: (v: number) => void
  onReset?: () => void
}

// editable HP resource bar.
export function HpGauge({ current, max, label, resetLabel, onChange, onReset }: HpGaugeProps) {
  const pct = max ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const tone = pct > 50 ? "var(--ok)" : pct > 25 ? "var(--warn)" : "var(--bad)"
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline gap-2">
        <span className="flex-none font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{label}</span>
        {onChange ? (
          <input
            className={cn(INPUT_CLASS, "w-[58px] text-right font-mono text-[12px]")}
            type="number"
            min={1}
            max={max}
            value={current}
            aria-label={label}
            onChange={(e) => onChange(Math.min(max, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        ) : (
          <span className="font-mono text-[12px]/none font-semibold text-txt-muted">{current}</span>
        )}
        <span className="font-mono text-[12px]/none font-semibold text-txt-muted">/ {max}</span>
        <span className="font-mono text-[12px]/none font-semibold" style={{ color: tone }}>
          {pct.toFixed(0)}%
        </span>
        {onReset && resetLabel && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto border-0 bg-transparent font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim hover:text-accent-bright"
          >
            {resetLabel}
          </button>
        )}
      </div>
      <div className="h-[9px] overflow-hidden border border-solid border-line-2 bg-base">
        <div className="h-full transition-[width,background] duration-[260ms]" style={{ width: pct + "%", background: tone }} />
      </div>
    </div>
  )
}
