"use client"

interface HpBarProps {
  current: number
  max: number
  label?: string
  onChange?: (value: number) => void
  onReset?: () => void
  resetLabel?: string
}

export function HpBar({ current, max, label = "PS", onChange, onReset, resetLabel = "full" }: HpBarProps) {
  const pct = max ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const tone = pct > 50 ? "#34d399" : pct > 25 ? "#f5b342" : "#f06262"
  return (
    <div className="flex flex-col gap-[0.3rem]">
      <div className="flex items-center gap-[0.4rem]">
        <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-ink-dim font-bold">{label}</span>
        {onChange ? (
          <input
            className="w-[3.4rem] text-center font-mono text-xs text-ink bg-layer-2 [border-width:var(--hairline)] border-solid [border-color:var(--border-strong)] rounded-[6px] p-[0.3rem] focus:outline-none focus:[border-color:var(--secondary)]"
            type="number"
            min={1}
            max={max}
            value={current}
            onChange={(e) => onChange(Math.min(max, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        ) : (
          <span className="font-mono text-[11px] text-ink-muted">{current}</span>
        )}
        <span className="font-mono text-[11px] text-ink-muted">/ {max}</span>
        <span className="font-mono text-[11px] font-bold" style={{ color: tone }}>({pct.toFixed(0)}%)</span>
        {onReset && (
          <button
            className="ml-auto text-[9px] text-ink-dim hover:text-ink-muted cursor-pointer border-0 bg-none font-mono"
            onClick={onReset}
          >
            {resetLabel}
          </button>
        )}
      </div>
      <div className="h-[7px] rounded-[4px] bg-layer-3 overflow-hidden [border-width:var(--hairline)] border-solid [border-color:var(--border)]">
        <div className="h-full rounded-[4px] transition-[width] duration-[var(--dur)] ease-[var(--ease)]" style={{ width: pct + "%", background: tone }} />
      </div>
    </div>
  )
}
