"use client"
import { typeChart } from "../../dexUtils"
import { TypeChip } from "../../_components/TypeChip"
import { useTranslations } from "next-intl"
import { EyeSlashIcon, BoltIcon } from "@heroicons/react/24/outline"

interface TypeEffectivenessTableProps {
  type: string
}

const MULT_META: Record<string, { bg: string; fg: string; label: string; es: string }> = {
  "2": { bg: "rgba(251,146,60,0.12)", fg: "#fb923c", label: "×2", es: "Débil" },
  "1": { bg: "rgba(255,255,255,0.02)", fg: "var(--surface-400)", label: "×1", es: "Normal" },
  "0.5": { bg: "rgba(163,230,53,0.1)", fg: "#a3e635", label: "×½", es: "Resistente" },
  "0": { bg: "rgba(192,132,252,0.1)", fg: "#c084fc", label: "×0", es: "Inmune" },
}

const DEF_MULT_META: Record<string, { bg: string; fg: string; label: string; es: string }> = {
  "2": { bg: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "×2", es: "Débil" },
  "1": { bg: "rgba(255,255,255,0.02)", fg: "var(--surface-400)", label: "×1", es: "Normal" },
  "0.5": { bg: "rgba(163,230,53,0.1)", fg: "#a3e635", label: "×½", es: "Resistente" },
  "0": { bg: "rgba(192,132,252,0.1)", fg: "#c084fc", label: "×0", es: "Inmune" },
}

const OFF_ORDER = ["2", "1", "0.5", "0"]
const DEF_ORDER = ["2", "1", "0.5", "0"]

function groupByMultiplier(data: Record<string, number>, order: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  order.forEach((m) => { grouped[m] = [] })
  Object.entries(data).forEach(([type, mult]) => {
    const key = String(mult)
    if (grouped[key]) grouped[key].push(type)
  })
  return grouped
}

export default function TypeEffectivenessTable({ type }: TypeEffectivenessTableProps) {
  const t = useTranslations("pokedex")

  // Offensive: what this type deals damage to
  const offenseRaw: Record<string, number> = {}
  Object.keys(typeChart).forEach((targetType) => {
    offenseRaw[targetType] = typeChart[type]?.[targetType] || 1
  })

  // Defensive: what deals damage to this type
  const defenseRaw: Record<string, number> = {}
  Object.keys(typeChart).forEach((attackType) => {
    defenseRaw[attackType] = typeChart[attackType]?.[type] || 1
  })

  const offense = groupByMultiplier(offenseRaw, OFF_ORDER)
  const defense = groupByMultiplier(defenseRaw, DEF_ORDER)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[22px]">
      {/* Defense column */}
      <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-[16px_18px]">
        <h4 className="font-orbitron font-semibold text-sm text-surface-50 mb-3.5 pb-3 border-b border-white/[0.05] flex items-center gap-2">
          <EyeSlashIcon className="w-3.5 h-3.5" />
          Daño recibido
          <span className="font-inter font-normal text-[11.5px] text-surface-500 ml-auto">por tipo atacante</span>
        </h4>
        <div className="flex flex-col gap-1.5">
          {DEF_ORDER.map((mult) => {
            const types = defense[mult]
            if (!types || types.length === 0) return null
            const meta = DEF_MULT_META[mult]
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

      {/* Offense column */}
      <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-[16px_18px]">
        <h4 className="font-orbitron font-semibold text-sm text-surface-50 mb-3.5 pb-3 border-b border-white/[0.05] flex items-center gap-2">
          <BoltIcon className="w-3.5 h-3.5" />
          Daño infligido
          <span className="font-inter font-normal text-[11.5px] text-surface-500 ml-auto">mejor multiplicador</span>
        </h4>
        <div className="flex flex-col gap-1.5">
          {OFF_ORDER.map((mult) => {
            const types = offense[mult]
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
    </div>
  )
}
