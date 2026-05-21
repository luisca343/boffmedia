"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { BookmarkIcon } from "@heroicons/react/24/outline"
import { usePokedexData } from "@/hooks/usePokedexData"

export function GoalsCard() {
  const t = useTranslations("pokedex")
  const { pokedexData } = usePokedexData()

  const goals = useMemo(() => {
    if (!pokedexData) return []

    const caught = pokedexData.caughtPokemon || []
    const shinyCount = pokedexData.shinyCount || 0

    const gen1Caught = caught.filter((key) => {
      const dex = parseInt(key.split(":")[0])
      return dex >= 1 && dex <= 151
    }).length

    const uniqueTypes = new Set<string>()
    for (const key of caught) {
      const parts = key.split(":")
      const dex = parseInt(parts[0])
      if (dex > 0) {
        uniqueTypes.add(String(dex))
      }
    }

    return [
      { label: t("hub_goals_gen1"), value: gen1Caught, total: 151, color: "#fb923c" },
      { label: t("hub_goals_shiny", { count: 10 }), value: shinyCount, total: 10, color: "#f0abfc" },
      { label: t("hub_goals_types", { count: 5 }), value: Math.min(uniqueTypes.size, 18), total: 18, color: "#22d3ee" },
    ]
  }, [pokedexData])

  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-[14px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron font-semibold text-[15px] tracking-tight text-surface-50 flex items-center gap-2.5">
          <BookmarkIcon className="w-4 h-4 text-primary-400" />
          {t("hub_goals_title")}
        </h3>
        <button className="text-xs text-surface-400 hover:text-primary-300 transition-colors">
          {t("hub_goals_edit")}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {goals.map((g, i) => {
          const pct = (g.value / g.total) * 100
          return (
            <div key={i}>
              <div className="flex justify-between mb-1.5 text-[12.5px] text-surface-200">
                <span>{g.label}</span>
                <span className="font-jetbrains tabular-nums text-surface-400">
                  <span className="font-semibold" style={{ color: g.color }}>{g.value}</span> / {g.total}
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    background: g.color,
                    boxShadow: `0 0 6px ${g.color}55`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
