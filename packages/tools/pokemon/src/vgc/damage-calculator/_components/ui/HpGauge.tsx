"use client"

import { cn } from "@boffmedia/ui/cn"
import { Input } from "@boffmedia/ui"

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
        <span className="flex-none font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{label}</span>
        {onChange ? (
          <Input
            className="w-[3.625rem] text-right font-mono text-[0.75rem]"
            type="number"
            min={1}
            max={max}
            value={current}
            aria-label={label}
            onChange={(e) => onChange(Math.min(max, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        ) : (
          <span className="font-mono text-[0.75rem]/none font-semibold text-txt-muted">{current}</span>
        )}
        <span className="font-mono text-[0.75rem]/none font-semibold text-txt-muted">/ {max}</span>
        <span className="font-mono text-[0.75rem]/none font-semibold" style={{ color: tone }}>
          {pct.toFixed(0)}%
        </span>
        {onReset && resetLabel && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto border-0 bg-transparent font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.1em] text-txt-dim hover:text-accent-bright"
          >
            {resetLabel}
          </button>
        )}
      </div>
      <div className="h-[0.5625rem] overflow-hidden border border-solid border-line-2 bg-base">
        <div className="h-full transition-[width,background] duration-[260ms]" style={{ width: pct + "%", background: tone }} />
      </div>
    </div>
  )
}
