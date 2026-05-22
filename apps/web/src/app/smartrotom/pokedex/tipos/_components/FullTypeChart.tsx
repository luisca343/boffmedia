"use client"
import React from "react"
import { typeChart } from "../../dexUtils"
import { TypeChip } from "../../_components/TypeChip"
import { useTranslations } from "next-intl"
import { TYPE_COLORS } from "../../_utils/typeColors"

const MULT_META: Record<string, { bg: string; fg: string; label: string; es: string }> = {
  "4": { bg: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "×4", es: "Súper débil" },
  "2": { bg: "rgba(251,146,60,0.12)", fg: "#fb923c", label: "×2", es: "Débil" },
  "1": { bg: "rgba(255,255,255,0.02)", fg: "var(--surface-400)", label: "×1", es: "Normal" },
  "0.5": { bg: "rgba(163,230,53,0.1)", fg: "#a3e635", label: "×½", es: "Resistente" },
  "0.25": { bg: "rgba(34,211,238,0.1)", fg: "#22d3ee", label: "×¼", es: "Muy resistente" },
  "0": { bg: "rgba(192,132,252,0.1)", fg: "#c084fc", label: "×0", es: "Inmune" },
}

const MULT_ORDER = ["4", "2", "1", "0.5", "0.25", "0"]

export default function FullTypeChart() {
  const t = useTranslations("pokedex")
  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting",
    "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
    "dragon", "dark", "steel", "fairy",
  ]

  // Build defense grouped data (what types deal more/less damage to each type)
  const defenseGrouped: Record<string, Record<string, string[]>> = {}
  pokemonTypes.forEach((defType) => {
    defenseGrouped[defType] = {}
    MULT_ORDER.forEach((m) => { defenseGrouped[defType][m] = [] })
    pokemonTypes.forEach((atkType) => {
      const eff = typeChart[atkType]?.[defType] ?? 1
      const key = String(eff)
      if (defenseGrouped[defType][key]) {
        defenseGrouped[defType][key].push(atkType)
      }
    })
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Compact matrix */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-px bg-white/[0.03] border border-white/[0.05] rounded-xl p-1.5 w-fit"
          style={{ gridTemplateColumns: `36px repeat(18, 36px)` }}
        >
          {/* Corner */}
          <div className="w-9 h-9 grid place-items-center text-surface-500 font-jetbrains text-[8px]">↓→</div>

          {/* Column headers */}
          {pokemonTypes.map((type) => (
            <div
              key={`head-${type}`}
              className="w-9 h-9 grid place-items-center rounded-sm"
              style={{ background: TYPE_COLORS[type] }}
            >
              <img src={`/smartrotom/img/types/${type}.png`} className="w-[18px] h-[18px]" alt={t(`type_${type}`)} />
            </div>
          ))}

          {/* Rows */}
          {pokemonTypes.map((attackType) => (
            <React.Fragment key={`row-${attackType}`}>
              <div
                className="w-9 h-9 grid place-items-center rounded-sm"
                style={{ background: TYPE_COLORS[attackType] }}
              >
                <img src={`/smartrotom/img/types/${attackType}.png`} className="w-[18px] h-[18px]" alt={t(`type_${attackType}`)} />
              </div>

              {pokemonTypes.map((defenseType) => {
                const eff = typeChart[attackType]?.[defenseType] ?? 1
                const meta = MULT_META[String(eff)] || MULT_META["1"]
                return (
                  <div
                    key={`${attackType}-${defenseType}`}
                    className="w-9 h-9 grid place-items-center rounded-sm font-jetbrains text-[10px] font-semibold tabular-nums cursor-default"
                    style={{ background: meta.bg, color: meta.fg }}
                    title={`${t(`type_${attackType}`)} → ${t(`type_${defenseType}`)}: ${eff}×`}
                  >
                    {eff !== 1 ? (eff === 0.5 ? "½" : eff === 0.25 ? "¼" : `${eff}`) : ""}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {MULT_ORDER.filter((m) => m !== "1").map((m) => {
          const meta = MULT_META[m]
          return (
            <div key={m} className="flex items-center gap-1.5 text-[11px] text-surface-300">
              <span
                className="w-5 h-5 rounded grid place-items-center font-jetbrains text-[9px] font-semibold"
                style={{ background: meta.bg, color: meta.fg }}
              >
                {meta.label}
              </span>
              {meta.es}
            </div>
          )
        })}
        <span className="text-[11px] text-surface-500 ml-auto">Filas = atacante · Columnas = defensor</span>
      </div>
    </div>
  )
}
