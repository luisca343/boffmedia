"use client"
import { useState, use } from "react"
import MoveDataElement from "../_components/MoveData"
import { PokemonSpriteLink } from "../../_components/PokemonSprite"
import { useGetPokemonByMove } from "@/hooks/pokemon/useGetPokemonByMove"
import { useGetMove } from "@/hooks/pokemon/useGetMove"
import { InternalLink } from "@/components/ui/navigation/Link"
import { useTranslations } from "next-intl"
import { HubSidebar } from "../../_components/HubSidebar"
import { ArrowLeftIcon, BoltIcon } from "@heroicons/react/24/outline"

export default function Movimiento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { pokemon } = useGetPokemonByMove(id)
  const { move } = useGetMove(id)
  const t = useTranslations("pokedex")
  const [showAll, setShowAll] = useState(false)

  const displayLimit = 20
  const displayedPokemon = showAll ? pokemon : pokemon?.slice(0, displayLimit)
  const hasMoreToShow = pokemon && pokemon.length > displayLimit

  if (!move) {
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

  const moveName = t(`attack_${move.attackName.toLowerCase().replaceAll(" ", "_")}`)

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-4">
            <InternalLink
              href="/smartrotom/pokedex/movimientos"
              className="text-surface-400 hover:text-primary-300 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </InternalLink>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="icon w-5 h-5 rounded bg-primary-400/[0.12] text-primary-300 grid place-items-center">
                  <BoltIcon className="w-3 h-3" />
                </span>
                <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
                  Movimiento
                </span>
              </div>
              <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50">
                {moveName}
              </h1>
            </div>
            <span className="font-jetbrains text-xs text-surface-400">
              {pokemon?.length || 0} Pokémon
            </span>
          </div>
        </div>

        {/* Content: vertical stack — move data first, then Pokémon list */}
        <div className="flex-1 p-6 flex flex-col gap-5">
          {/* Move data */}
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5">
            <MoveDataElement id={id} isFullPage={true} />
          </div>

          {/* Pokémon list — last section, below Alcance */}
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron font-semibold text-[15px] tracking-tight text-surface-50">
                {t("move_pokemon_section")}
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
      </main>
    </div>
  )
}
