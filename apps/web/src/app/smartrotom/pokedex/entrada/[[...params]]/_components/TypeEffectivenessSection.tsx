import { getPokemonDefense, getPokemonCoverage } from "../../../dexUtils"
import { TypeChip } from "../../../_components/ui"

interface TypeEffectivenessSectionProps {
  type1?: string
  type2?: string
}

const MULT_CONFIG: Record<string, { bg: string; fg: string; label: string; es: string }> = {
  "4": { bg: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "×4", es: "Súper débil" },
  "2": { bg: "rgba(251,146,60,0.12)", fg: "#fb923c", label: "×2", es: "Débil" },
  "1": { bg: "rgba(255,255,255,0.02)", fg: "#97a6bb", label: "×1", es: "Normal" },
  "0.5": { bg: "rgba(163,230,53,0.1)", fg: "#a3e635", label: "×½", es: "Resistente" },
  "0.25": { bg: "rgba(34,211,238,0.1)", fg: "#22d3ee", label: "×¼", es: "Muy resistente" },
  "0": { bg: "rgba(192,132,252,0.1)", fg: "#c084fc", label: "×0", es: "Inmune" },
}

const DEF_ORDER = ["4", "2", "1", "0.5", "0.25", "0"]
const OFF_ORDER = ["2", "1", "0.5", "0"]

function groupByMultiplier(data: Record<string, number>): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  for (const [type, mult] of Object.entries(data)) {
    const key = String(mult)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(type)
  }
  return grouped
}

export function TypeEffectivenessSection({ type1, type2 }: TypeEffectivenessSectionProps) {
  const defense = groupByMultiplier(getPokemonDefense(type1!, type2))
  const coverage = groupByMultiplier(getPokemonCoverage(type1!, type2))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[22px]">
      <EffColumn title="Daño Recibido" sub="por tipo atacante" data={defense} order={DEF_ORDER} />
      <EffColumn title="Daño Infligido" sub="mejor multiplicador de sus tipos" data={coverage} order={OFF_ORDER} />
    </div>
  )
}

function EffColumn({ title, sub, data, order }: { title: string; sub: string; data: Record<string, string[]>; order: string[] }) {
  return (
    <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-[16px_18px]">
      <h4 className="font-pk-display font-semibold text-sm text-pk-surface-50 mb-3.5 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        {title}
        <span className="font-pk font-normal text-[11.5px] text-pk-surface-500 ml-auto">{sub}</span>
      </h4>
      <div className="flex flex-col gap-1.5">
        {order.map((mult) => {
          const types = data[mult] || []
          const cfg = MULT_CONFIG[mult]
          if (!cfg) return null
          return (
            <div
              key={mult}
              className="grid gap-3 items-center min-h-[46px] rounded-[10px] px-3 py-2.5 border"
              style={{ gridTemplateColumns: "110px 1fr 32px", background: cfg.bg, borderColor: `color-mix(in oklab, ${cfg.fg} 22%, transparent)` }}
            >
              <div className="flex flex-col border-r pr-2.5" style={{ borderColor: `color-mix(in oklab, ${cfg.fg} 18%, transparent)` }}>
                <span className="font-pk-display font-bold text-lg leading-none tabular-nums" style={{ color: cfg.fg }}>
                  {cfg.label}
                </span>
                <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-400 mt-0.5">{cfg.es}</span>
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                {types.length === 0 ? (
                  <span className="text-[11.5px] text-pk-surface-500 italic">— ningún tipo —</span>
                ) : (
                  types.map((type) => <TypeChip key={type} type={type} size="sm" />)
                )}
              </div>
              <span className="font-pk-mono text-[11px] font-semibold text-pk-surface-400 bg-black/25 px-1.5 py-0.5 rounded text-center tabular-nums">
                {types.length}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
