"use client"
import { useState, useEffect } from "react"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { InternalLink } from "@/components/ui/navigation/Link"
import { useTranslations } from "next-intl"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { getDisplayStatus } from "../../../dexUtils"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { HubSidebar } from "../../../_components/HubSidebar"

export default function PokemonList() {
  const [pokemonList, setPokemonList] = useState<Array<{ dex: number; name: string; spriteUrl: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const t = useTranslations("pokedex")

  useEffect(() => {
    async function fetchPokemonList() {
      try {
        const pokemonList = (await PokemonService.getPokemon()).data! as Array<{
          dex: number
          name: string
          spriteUrl: string
        }>
        setPokemonList(Array.isArray(pokemonList) ? pokemonList : [])
      } catch (error) {
        console.error("Failed to fetch Pokemon list:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPokemonList()
  }, [])

  const filteredPokemon = pokemonList.filter((pokemon) => {
    const name = getDisplayStatus(pokemon.dex, "base", true) ? pokemon.name : "???"
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pokemon.dex.toString().includes(searchQuery) ||
      (name === "???" && searchQuery.toLowerCase().includes("???"))
    )
  })

  if (loading) {
    return (
      <div className="flex h-full bg-surface-950">
        <HubSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
            <div className="text-surface-100 text-xl font-orbitron">Cargando Pokédex...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <div className="flex-1 overflow-auto min-w-0">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
              Pokédex
            </span>
            <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50 mt-1">
              Explorar Pokédex
            </h1>
            <p className="text-surface-300 text-sm mt-1">
              Explora todos los Pokémon registrados. Haz clic en un Pokémon para ver su información detallada.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="search"
              placeholder="Buscar por nombre o número..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] text-surface-100 text-sm px-3 py-2.5 pl-9 outline-none focus:border-primary-400/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Pokemon grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {filteredPokemon.map((pokemon) => {
              const isSeen = getDisplayStatus(pokemon.dex, "base", true)
              return (
                <InternalLink
                  href={`/smartrotom/pokedex/entrada/${pokemon.dex}`}
                  key={pokemon.dex}
                  className="block"
                >
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 hover:bg-white/[0.04] hover:border-primary-400/20 transition-all flex flex-col items-center group">
                    <PokemonSprite
                      id={pokemon.dex}
                      form="base"
                      palette="none"
                      width={72}
                      height={72}
                      hide={true}
                      url={pokemon.spriteUrl}
                      className="group-hover:-translate-y-0.5 transition-transform"
                    />
                    <div className="text-center mt-1.5 w-full">
                      <div className="font-jetbrains text-[10px] text-surface-500">
                        #{pokemon.dex.toString().padStart(3, "0")}
                      </div>
                      <div className="text-surface-100 text-xs font-medium truncate w-full">
                        {isSeen
                          ? t(`pixelmon_${pokemon.name.toLowerCase()}`) || pokemon.name
                          : "???"}
                      </div>
                    </div>
                  </div>
                </InternalLink>
              )
            })}
          </div>

          {filteredPokemon.length === 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center mt-4">
              <p className="text-surface-300 text-lg">No se encontraron Pokémon que coincidan con la búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
