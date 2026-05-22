"use client"
import { useState, use } from "react"
import AbilityDataElement from "../_components/AbilityData"
import { PokemonSpriteLink } from "../../_components/PokemonSprite"
import { useGetPokemonByAbility } from "@/hooks/pokemon/useGetPokemonByAbility"
import { useGetAbility } from "@/hooks/pokemon/useGetAbility"
import { ArrowLeftIcon, SparklesIcon, StarIcon } from "@heroicons/react/24/outline"
import { InternalLink } from "@/components/ui/navigation/Link"
import { useTranslations } from "next-intl"
import { HubSidebar } from "../../_components/HubSidebar"

export default function Habilidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { pokemon } = useGetPokemonByAbility(id)
  const { ability } = useGetAbility(id)
  const t = useTranslations("pokedex")
  const [showAll, setShowAll] = useState(false)

  const displayLimit = 20
  const displayedPokemon = showAll ? pokemon : pokemon?.slice(0, displayLimit)
  const hasMoreToShow = pokemon && pokemon.length > displayLimit

  if (!ability) {
    return (
      <div className="flex h-full bg-surface-950">
        <HubSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
            <div className="text-surface-100 text-xl font-orbitron">Cargando...</div>
          </div>
        </main>
      </div>
    )
  }

  const abilityName = t(`ability_${ability.name.replace(/\s+/g, "")}`)
  const isHidden = ability.isHidden

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-4">
            <InternalLink
              href="/smartrotom/pokedex/habilidades"
              className="text-surface-400 hover:text-primary-300 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </InternalLink>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="icon w-5 h-5 rounded bg-primary-400/[0.12] text-primary-300 grid place-items-center">
                  {isHidden ? <SparklesIcon className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
                </span>
                <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
                  Habilidad
                </span>
              </div>
              <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50">
                {abilityName}
              </h1>
            </div>
            {isHidden !== undefined && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-[0.1em] uppercase"
                style={{
                  color: isHidden ? "rgb(var(--accent-300))" : "rgb(var(--surface-200))",
                  background: isHidden ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isHidden ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {isHidden ? <SparklesIcon className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
                {isHidden ? "Oculta" : "Estándar"}
              </span>
            )}
          </div>
        </div>

        {/* Content: 2-column — ability data left, Pokémon list right */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Ability data */}
            <div
              className="lg:col-span-5 bg-white/[0.025] border border-white/[0.06] rounded-xl p-5 h-fit"
              style={
                isHidden
                  ? { borderColor: "rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.04)" }
                  : undefined
              }
            >
              <AbilityDataElement id={id} isFullPage={true} />
            </div>

            {/* Pokémon list */}
            <div className="lg:col-span-7 bg-white/[0.025] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron font-semibold text-[15px] tracking-tight text-surface-50">
                  {t("ability_pokemon_section")}
                </h2>
                <span className="font-jetbrains text-xs text-primary-300 bg-primary-400/[0.12] px-2 py-0.5 rounded-full">
                  {pokemon?.length || 0}
                </span>
              </div>
              {pokemon && pokemon.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
                  {displayedPokemon?.map((poke) => (
                    <div
                      key={poke.speciesID + poke.form}
                      className="bg-white/[0.02] border border-white/[0.05] rounded-[9px] p-2 flex flex-col items-center gap-1 cursor-pointer transition-all hover:-translate-y-px hover:border-primary-400/20"
                    >
                      <PokemonSpriteLink
                        id={poke.speciesID}
                        form={poke.form}
                        palette="none"
                        width={48}
                        height={48}
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
                <div className="p-6 text-center text-surface-400">{t("no_pokemon_found")}</div>
              )}
              {hasMoreToShow && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-surface-200 hover:bg-white/[0.07] transition-colors cursor-pointer"
                  >
                    {showAll ? t("show_less") : t("show_all", { count: pokemon.length })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
