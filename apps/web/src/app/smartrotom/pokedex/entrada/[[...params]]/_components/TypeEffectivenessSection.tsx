import { getPokemonDefense, getPokemonCoverage } from "../../../dexUtils"
import { TypeChip } from "../../../_components/ui"
import { useTranslations } from "next-intl"

interface TypeEffectivenessSectionProps {
  type1?: string
  type2?: string
}

const MULT_CONFIG: Record<string, { bg: string; fg: string; label: string; key: string }> = {
  "4": { bg: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "×4", key: "eff_super_weak" },
  "2": { bg: "rgba(251,146,60,0.12)", fg: "#fb923c", label: "×2", key: "eff_weak" },
  "1": { bg: "rgba(255,255,255,0.02)", fg: "#97a6bb", label: "×1", key: "eff_normal" },
  "0.5": { bg: "rgba(163,230,53,0.1)", fg: "#a3e635", label: "×½", key: "eff_resistant" },
  "0.25": { bg: "rgba(34,211,238,0.1)", fg: "#22d3ee", label: "×¼", key: "eff_very_resistant" },
  "0": { bg: "rgba(192,132,252,0.1)", fg: "#c084fc", label: "×0", key: "eff_immune" },
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
  const t = useTranslations("pokedex")
  const defense = groupByMultiplier(getPokemonDefense(type1!, type2))
  const coverage = groupByMultiplier(getPokemonCoverage(type1!, type2))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.375rem]">
      <EffColumn title={t("eff_damage_received")} sub={t("eff_by_attacker_type")} data={defense} order={DEF_ORDER} t={t} />
      <EffColumn title={t("eff_damage_dealt")} sub={t("eff_best_multiplier")} data={coverage} order={OFF_ORDER} t={t} />
    </div>
  )
}

function EffColumn({ title, sub, data, order, t }: { title: string; sub: string; data: Record<string, string[]>; order: string[]; t: any }) {
  return (
    <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-[16px_18px]">
      <h4 className="font-pk-display font-semibold text-sm text-pk-surface-50 mb-3.5 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        {title}
        <span className="font-pk font-normal text-[0.71875rem] text-pk-surface-500 ml-auto">{sub}</span>
      </h4>
      <div className="flex flex-col gap-1.5">
        {order.map((mult) => {
          const types = data[mult] || []
          const cfg = MULT_CONFIG[mult]
          if (!cfg) return null
          return (
            <div
              key={mult}
              className="grid gap-3 items-center min-h-[2.875rem] rounded-[10px] px-3 py-2.5 border"
              style={{ gridTemplateColumns: "110px 1fr 32px", background: cfg.bg, borderColor: `color-mix(in oklab, ${cfg.fg} 22%, transparent)` }}
            >
              <div className="flex flex-col border-r pr-2.5" style={{ borderColor: `color-mix(in oklab, ${cfg.fg} 18%, transparent)` }}>
                <span className="font-pk-display font-bold text-lg leading-none tabular-nums" style={{ color: cfg.fg }}>
                  {cfg.label}
                </span>
                <span className="font-pk-mono text-[0.625rem] tracking-[0.08em] uppercase text-pk-surface-400 mt-0.5">{t(cfg.key)}</span>
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                {types.length === 0 ? (
                  <span className="text-[0.71875rem] text-pk-surface-500 italic">{t("eff_no_types")}</span>
                ) : (
                  types.map((type) => <TypeChip key={type} type={type} size="sm" />)
                )}
              </div>
              <span className="font-pk-mono text-[0.6875rem] font-semibold text-pk-surface-400 bg-black/25 px-1.5 py-0.5 rounded text-center tabular-nums">
                {types.length}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
