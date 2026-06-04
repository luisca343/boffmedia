interface StatItem {
  name: string
  pct: number
}

interface ToolStatBarsProps {
  title?: string
  items: StatItem[]
  tone?: string
  max?: number
}

export function ToolStatBars({ title, items, tone, max }: ToolStatBarsProps) {
  const peak = max != null ? max : Math.max(...items.map((i) => i.pct), 1)
  const color = tone || "var(--accent)"
  return (
    <div>
      {title && <div className="font-mono text-xs tracking-wider uppercase text-[color:var(--text-dim)] mb-2">{title}</div>}
      {items.map((it) => (
        <div key={it.name} className="mb-1.5">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-[color:var(--text-muted)]">{it.name}</span>
            <span className="font-mono text-[color:var(--accent-bright)]">{it.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: (it.pct / peak) * 100 + "%", background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}
