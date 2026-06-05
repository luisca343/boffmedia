import { cn } from "@/lib/utils"

interface HeatGridProps {
  rows: (string | number)[]
  cols: (string | number)[]
  value: (ri: number, ci: number) => number | { n: number }
  max?: number
  colLabel?: (c: string | number, ci: number) => React.ReactNode
  className?: string
}

export function HeatGrid({ rows, cols, value, max, colLabel, className }: HeatGridProps) {
  const peak = max || 1
  return (
    <div className={cn(className)}>
      <div
        className="grid gap-[3px] items-center"
        style={{ gridTemplateColumns: `auto repeat(${cols.length}, 1fr)` }}
      >
        <span />
        {cols.map((c, ci) => (
          <span key={ci} className="font-mono text-[9px] text-[var(--text-dim)] text-center">
            {colLabel ? colLabel(c, ci) : c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <span key={ri} className="contents">
            <span className="font-mono text-[10px] text-[var(--text-dim)] pr-[6px] text-right">{r}</span>
            {cols.map((c, ci) => {
              const v = value(ri, ci)
              const n = typeof v === "number" ? v : (v ? v.n : 0)
              const intensity = Math.min(1, n / peak)
              return (
                <span
                  key={ci}
                  title={String(n)}
                  className="aspect-square rounded-[2px] min-h-[12px]"
                  style={{
                    background: n
                      ? `color-mix(in srgb, var(--accent) ${Math.round(18 + intensity * 82)}%, transparent)`
                      : "var(--surface-3)",
                  }}
                />
              )
            })}
          </span>
        ))}
      </div>
    </div>
  )
}
