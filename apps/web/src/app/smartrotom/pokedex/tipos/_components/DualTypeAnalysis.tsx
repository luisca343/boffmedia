"use client"
import { getPokemonDefense } from "../../dexUtils"
import { TypeChip } from "../../_components/TypeChip"
import { useTranslations } from "next-intl"

interface DualTypeAnalysisProps {
  type1: string
  type2: string
}

const MULT_META: Record<string, { bg: string; fg: string; label: string; es: string }> = {
  "4": { bg: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "×4", es: "Súper débil" },
  "2": { bg: "rgba(251,146,60,0.12)", fg: "#fb923c", label: "×2", es: "Débil" },
  "1": { bg: "rgba(255,255,255,0.02)", fg: "var(--surface-400)", label: "×1", es: "Normal" },
  "0.5": { bg: "rgba(163,230,53,0.1)", fg: "#a3e635", label: "×½", es: "Resistente" },
  "0.25": { bg: "rgba(34,211,238,0.1)", fg: "#22d3ee", label: "×¼", es: "Muy resistente" },
  "0": { bg: "rgba(192,132,252,0.1)", fg: "#c084fc", label: "×0", es: "Inmune" },
}

const MULT_ORDER = ["4", "2", "1", "0.5", "0.25", "0"]

export default function DualTypeAnalysis({ type1, type2 }: DualTypeAnalysisProps) {
  const t = useTranslations("pokedex")
  const defenses = getPokemonDefense(type1, type2)

  // Group by multiplier
  const grouped: Record<string, string[]> = {}
  MULT_ORDER.forEach((m) => { grouped[m] = [] })
  Object.entries(defenses).forEach(([type, effectiveness]) => {
    const key = String(effectiveness)
    if (grouped[key]) grouped[key].push(type)
  })

  return (
    <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-[16px_18px]">
      <h4 className="font-orbitron font-semibold text-sm text-surface-50 mb-3.5 pb-3 border-b border-white/[0.05]">
        Daño recibido (defensa combinada)
      </h4>
      <div className="flex flex-col gap-1.5">
        {MULT_ORDER.map((mult) => {
          const types = grouped[mult]
          if (!types || types.length === 0) return null
          const meta = MULT_META[mult]
          return (
            <div
              key={mult}
              className="grid grid-cols-[110px_1fr_32px] gap-3 items-center min-h-[46px] rounded-[10px] px-3 py-2.5 border"
              style={{
                background: meta.bg,
                borderColor: `color-mix(in oklab, ${meta.fg} 22%, transparent)`,
              }}
            >
              <div
                className="flex flex-col border-r pr-2.5"
                style={{ borderColor: `color-mix(in oklab, ${meta.fg} 18%, transparent)` }}
              >
                <span className="font-orbitron font-bold text-lg leading-none tabular-nums" style={{ color: meta.fg }}>
                  {meta.label}
                </span>
                <span className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-400">
                  {meta.es}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                {types.map((tp) => (
                  <TypeChip key={tp} type={tp} size="sm" />
                ))}
              </div>
              <span className="font-jetbrains text-[11px] font-semibold text-surface-400 bg-black/25 px-1.5 py-0.5 rounded text-center tabular-nums">
                {types.length}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
