import { STAT_META, STAT_ORDER, NATURE_CHANGES } from "./meta-data"

interface SpreadData {
  nature: string
  ev: number[]
  pct: number
}

interface SpreadProps {
  data: SpreadData
}

export function EvSpread({ data }: SpreadProps) {
  const changes = NATURE_CHANGES[data.nature] ?? null
  const parts = STAT_ORDER.map((k, i) => ({ k, v: data.ev[i] || 0 })).filter((p) => p.v > 0)

  return (
    <div className="flex items-start justify-between gap-3 py-[0.35rem] border-b border-[color-mix(in_srgb,var(--border)_45%,transparent)] last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--text)] leading-tight">
          {data.nature}
          {changes && (
            <span className="ml-1.5 text-[10px] font-normal">
              <span style={{ color: STAT_META[changes.plus].color }}>
                +{STAT_META[changes.plus].label}
              </span>{" "}
              <span className="text-[var(--rose-400)]">
                -{STAT_META[changes.minus].label}
              </span>
            </span>
          )}
        </p>
        <p className="text-[11px] font-mono leading-tight mt-0.5 text-[var(--text-muted)]">
          {parts.map((p, i) => (
            <span key={p.k}>
              {i > 0 && <span className="text-[var(--text-dim)]"> / </span>}
              <span>{p.v} </span>
              <span style={{ color: STAT_META[p.k].color }}>{STAT_META[p.k].label}</span>
            </span>
          ))}
        </p>
      </div>
      <span className="font-mono text-xs text-[var(--text-muted)] shrink-0">
        {data.pct.toFixed(2)}%
      </span>
    </div>
  )
}
