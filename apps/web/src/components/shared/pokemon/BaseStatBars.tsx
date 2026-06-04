interface BaseStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

interface BaseStatBarsProps {
  base: BaseStats
  title?: string
  max?: number
}

const STAT_META: Record<string, [string, string]> = {
  hp: ["PS", "#ff5959"],
  atk: ["Atq", "#f5ac78"],
  def: ["Def", "#fae078"],
  spa: ["AtE", "#9db7f5"],
  spd: ["DfE", "#a7db8d"],
  spe: ["Vel", "#fa92b2"],
}

const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"] as const

export function BaseStatBars({ base, title = "Estadísticas base", max = 200 }: BaseStatBarsProps) {
  const total = STAT_ORDER.reduce((a, k) => a + (base[k] || 0), 0)
  return (
    <div>
      {title && <div className="font-mono text-xs tracking-wider uppercase text-[color:var(--text-dim)] mb-2">{title}</div>}
      {STAT_ORDER.map((k) => (
        <div key={k} className="flex items-center gap-2 mb-1">
          <span className="w-7 font-mono text-xs font-bold text-right" style={{ color: STAT_META[k][1] }}>
            {STAT_META[k][0]}
          </span>
          <span className="w-8 font-mono text-xs text-right text-[color:var(--text)]">{base[k]}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: Math.min(100, (base[k] / max) * 100) + "%", background: STAT_META[k][1] }} />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--border)] text-xs">
        <span className="text-[color:var(--text-dim)] font-mono">BST</span>
        <span className="font-mono font-bold">{total}</span>
      </div>
    </div>
  )
}
