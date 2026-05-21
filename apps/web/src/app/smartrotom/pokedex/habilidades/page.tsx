"use client"
import { useTranslations } from "next-intl"
import { useGetAllAbilities } from "@/hooks/pokemon/useGetAllAbilities"
import { useGetAbility } from "@/hooks/pokemon/useGetAbility"
import type { AbilityCount } from "@boffmedia/shared"
import { MagnifyingGlassIcon, SparklesIcon, StarIcon } from "@heroicons/react/24/outline"
import { useState, useMemo } from "react"
import { HubSidebar } from "../_components/HubSidebar"
import { useGetPokemonByAbility } from "@/hooks/pokemon/useGetPokemonByAbility"
import { PokemonSpriteLink } from "../_components/PokemonSprite"

function AbilityDetailCard({ abilityName, t }: { abilityName: string; t: any }) {
  const { ability } = useGetAbility(abilityName)
  const { pokemon } = useGetPokemonByAbility(abilityName)
  const [showAll, setShowAll] = useState(false)

  if (!ability) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
      </div>
    )
  }

  const name = t(`ability_${ability.name.replace(/\s+/g, "")}`)
  const description = t(`ability_${ability.name.replace(/\s+/g, "")}_description`)
  const isHidden = ability.isHidden
  const displayLimit = 12
  const displayPokemon = showAll ? (pokemon || []) : (pokemon?.slice(0, displayLimit) || [])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="font-orbitron font-bold text-lg text-surface-50">{name}</span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.1em] uppercase"
          style={{
            color: isHidden ? "rgb(var(--accent-300))" : "rgb(var(--surface-200))",
            background: isHidden ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
          }}
        >
          {isHidden ? <SparklesIcon className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
          {isHidden ? "Oculta" : "Estándar"}
        </span>
      </div>

      {/* Effect */}
      <div
        className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
        style={isHidden ? { borderLeftColor: "rgb(var(--accent-500))", borderLeftWidth: 3 } : undefined}
      >
        <div className="flex items-start gap-3">
          <SparklesIcon
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: isHidden ? "rgb(var(--accent-300))" : "rgb(var(--primary-300))" }}
          />
          <div>
            <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Efecto</h3>
            <p className="text-[14px] leading-[1.6] text-surface-100">{description}</p>
          </div>
        </div>
      </div>

      {/* Carriers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-jetbrains text-[10.5px] tracking-[0.1em] uppercase text-surface-500">
            Portadores
          </span>
          <span className="font-jetbrains text-xs text-surface-100">{pokemon?.length || 0}</span>
        </div>
        {displayPokemon.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1.5">
            {displayPokemon.map((poke) => (
              <div
                key={poke.speciesID + poke.form}
                className="bg-white/[0.02] border border-white/[0.05] rounded-[9px] p-1.5 flex flex-col items-center gap-0.5 cursor-pointer transition-all hover:-translate-y-px hover:border-primary-400/20"
              >
                <PokemonSpriteLink
                  id={poke.speciesID}
                  form={poke.form}
                  palette="none"
                  width={40}
                  height={40}
                  hide={true}
                  url={poke.spriteUrl}
                />
                <span className="font-jetbrains text-[9px] text-surface-500">
                  #{String(poke.speciesID).padStart(3, "0")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-surface-400 text-sm py-4">No se encontraron Pokémon</div>
        )}
        {pokemon && pokemon.length > displayLimit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 w-full bg-white/[0.03] border border-white/[0.06] text-surface-200 py-2 px-3 rounded-lg text-[12.5px] font-medium text-center hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {showAll ? "Mostrar menos" : `Ver todos (${pokemon.length}) →`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Habilidades() {
  const { abilities } = useGetAllAbilities()
  const t = useTranslations("pokedex")
  const [searchQuery, setSearchQuery] = useState("")
  const [showHidden, setShowHidden] = useState<string>("all")
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null)

  const filteredAbilities = useMemo(() => {
    if (!abilities) return []
    return abilities.filter((ability) => {
      const name = t(`ability_${ability.name.replace(/\s+/g, "")}`)
      const desc = t(`ability_${ability.name.replace(/\s+/g, "")}_description`)
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      // The list API may return isHidden even though the shared type doesn't declare it.
      const isHiddenAbility = (ability as AbilityCount & { isHidden?: boolean }).isHidden ?? false
      const matchesFilter =
        showHidden === "all" ||
        (showHidden === "hidden" && isHiddenAbility) ||
        (showHidden === "standard" && !isHiddenAbility)
      return matchesSearch && matchesFilter
    })
  }, [abilities, searchQuery, showHidden, t])

  if (!abilities)
    return (
      <div className="flex h-full bg-surface-950">
        <HubSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
            <div className="text-surface-100 text-xl font-orbitron">Cargando habilidades...</div>
          </div>
        </main>
      </div>
    )

  const maxCount = Math.max(...abilities.map((a) => a.count), 1)
  const hiddenCount = abilities.filter((a) => (a as AbilityCount & { isHidden?: boolean }).isHidden).length

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="icon w-5 h-5 rounded bg-primary-400/[0.12] text-primary-300 grid place-items-center">
                  <SparklesIcon className="w-3 h-3" />
                </span>
                <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
                  02 · Referencia
                </span>
              </div>
              <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50">
                {t("abilities_title")}
              </h1>
              <p className="text-surface-400 text-sm mt-1 max-w-[600px]">
                {abilities.length} habilidades catalogadas. Las ocultas se marcan con halo púrpura. Cada ficha incluye su efecto completo y los Pokémon que la portan.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-surface-400 font-jetbrains">
              <span>
                Total<b className="ml-1 text-surface-100">{abilities.length}</b>
              </span>
              <span>
                Resultados<b className="ml-1 text-surface-100">{filteredAbilities.length}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 pb-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="search"
              placeholder="Buscar por nombre o efecto…"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] py-2.5 pr-3 pl-9 text-[13px] text-surface-50 outline-none placeholder:text-surface-500 focus:border-primary-400/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Todas", count: abilities.length },
              { id: "standard", label: "Estándar", count: abilities.length - hiddenCount },
              { id: "hidden", label: "Ocultas", count: hiddenCount, color: "rgb(var(--accent-300))" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setShowHidden(filter.id)}
                className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border"
                style={
                  showHidden === filter.id
                    ? {
                        background: filter.id === "hidden" ? "rgba(168,85,247,0.12)" : "rgba(249,115,22,0.14)",
                        color: filter.color || "rgb(var(--primary-200))",
                        borderColor: filter.id === "hidden" ? "rgba(168,85,247,0.3)" : "rgba(249,115,22,0.35)",
                      }
                    : { background: "rgba(255,255,255,0.03)", color: "rgb(var(--surface-200))", borderColor: "rgba(255,255,255,0.07)" }
                }
              >
                {filter.label}
                <span className="font-jetbrains text-[10px] opacity-70">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content: list + detail */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[18px] items-start">
            {/* List */}
            <div className="flex flex-col border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.012]">
              {filteredAbilities.length > 0 ? (
                filteredAbilities.map((ability: AbilityCount) => {
                  const isSelected = selectedAbility === ability.name
                  return (
                    <button
                      key={ability.name}
                      onClick={() => setSelectedAbility(ability.name)}
                      className="grid grid-cols-[36px_1fr_80px_56px] items-center gap-3.5 px-4 py-3 border-b border-white/[0.04] last:border-b-0 transition-colors cursor-pointer text-left"
                      style={
                        isSelected
                          ? { background: "rgba(249,115,22,0.08)", boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.25)" }
                          : { background: "transparent" }
                      }
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <div className="w-8 h-8 grid place-items-center rounded-lg bg-white/[0.04] text-surface-300">
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold text-surface-50 tracking-tight">
                          {t(`ability_${ability.name.replace(/\s+/g, "")}`)}
                        </span>
                        <span className="text-xs text-surface-400 line-clamp-1">
                          {t(`ability_${ability.name.replace(/\s+/g, "")}_description`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-[60px] h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-400 rounded-full"
                            style={{ width: `${(ability.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="font-jetbrains text-xs font-semibold text-surface-100 tabular-nums min-w-[36px] text-right">
                          {ability.count}
                        </span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-surface-500 justify-self-end">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  )
                })
              ) : (
                <div className="p-8 text-center text-surface-400">No hay habilidades que coincidan con los filtros.</div>
              )}
            </div>

            {/* Detail card */}
            <div className="sticky top-6">
              {selectedAbility ? (
                <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5">
                  <AbilityDetailCard abilityName={selectedAbility} t={t} />
                </div>
              ) : (
                <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-8 text-center">
                  <SparklesIcon className="w-8 h-8 mx-auto text-surface-500 mb-3" />
                  <p className="text-surface-400 text-sm">Selecciona una habilidad para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
