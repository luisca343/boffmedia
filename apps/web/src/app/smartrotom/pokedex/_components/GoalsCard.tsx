"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { BookmarkIcon } from "@heroicons/react/24/outline"
import { usePokedexData } from "@/hooks/usePokedexData"
import { usePokemonStore } from "@/stores/pokemonStore"

export function GoalsCard() {
  const t = useTranslations("pokedex")
  const { pokedexData } = usePokedexData()
  const allPokemon = usePokemonStore((state) => state.allPokemon)
  const pokemonByDex = usePokemonStore((state) => state.pokemonByDex)

  const goals = useMemo(() => {
    if (!pokedexData) return []

    const caught = pokedexData.caughtPokemon || []
    const shinyCount = pokedexData.shinyCount || 0

    const gen1Caught = caught.filter((key) => {
      const dex = parseInt(key.split(":")[0])
      return dex >= 1 && dex <= 151
    }).length

    // Collect unique Pokémon types from caught Pokémon by cross-referencing the store.
    // Each key is "dex:form"; we look up the Pokémon's types from allPokemon or pokemonByDex.
    const uniqueTypes = new Set<string>()
    for (const key of caught) {
      const dex = parseInt(key.split(":")[0])
      const formName = key.split(":")[1] || "base"
      const pokemon = pokemonByDex[dex] ?? allPokemon.find((p) => p.dex === dex)
      if (pokemon) {
        const form = pokemon.forms.find((f) => f.name === formName) ?? pokemon.forms[0]
        const types = (form?.types as string[] | undefined) ?? []
        for (const type of types) {
          uniqueTypes.add(type.toLowerCase())
        }
      }
    }

    return [
      { label: t("hub_goals_gen1"), value: gen1Caught, total: 151, color: "#fb923c" },
      { label: t("hub_goals_shiny", { count: 10 }), value: shinyCount, total: 10, color: "#f0abfc" },
      { label: t("hub_goals_types", { count: 5 }), value: Math.min(uniqueTypes.size, 18), total: 18, color: "#22d3ee" },
    ]
  }, [pokedexData, allPokemon, pokemonByDex])

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
