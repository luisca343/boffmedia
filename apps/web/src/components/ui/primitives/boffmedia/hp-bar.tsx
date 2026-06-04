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
    <div>
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className="font-mono text-xs text-[color:var(--text-dim)] uppercase">{label}</span>
        {onChange ? (
          <input
            className="w-14 px-1.5 py-0.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-sm text-center font-mono text-[color:var(--text)] focus:outline-none focus:border-[var(--accent)]"
            type="number"
            min={1}
            max={max}
            value={current}
            onChange={(e) => onChange(Math.min(max, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        ) : (
          <span className="font-mono font-bold text-[color:var(--text)]">{current}</span>
        )}
        <span className="font-mono text-xs text-[color:var(--text-dim)]">/ {max}</span>
        <span className="font-mono text-xs font-bold" style={{ color: tone }}>({pct.toFixed(0)}%)</span>
        {onReset && (
          <button
            className="ml-auto text-xs text-[color:var(--accent-bright)] hover:underline cursor-pointer border-0 bg-transparent font-medium"
            onClick={onReset}
          >
            {resetLabel}
          </button>
        )}
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: pct + "%", background: tone }} />
      </div>
    </div>
  )
}
