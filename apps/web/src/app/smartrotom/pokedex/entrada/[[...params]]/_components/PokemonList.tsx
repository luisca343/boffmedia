"use client"
import { useState, useEffect } from "react"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { MagnifyingGlassIcon, BookOpenIcon } from "@heroicons/react/24/outline"
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
        const list = (await PokemonService.getPokemon()).data! as Array<{ dex: number; name: string; spriteUrl: string }>
        setPokemonList(Array.isArray(list) ? list : [])
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
      <div className="flex h-full">
        <HubSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-pk-primary-300 rounded-full border-t-transparent" />
            <div className="text-pk-surface-100 text-xl font-pk-display">Cargando Pokédex…</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded bg-pk-primary-400/[0.12] text-pk-primary-300 grid place-items-center">
                  <BookOpenIcon className="w-3 h-3" />
                </span>
                <span className="font-pk-mono text-[10.5px] tracking-[0.12em] uppercase text-pk-surface-500">Pokédex</span>
              </div>
              <h1 className="font-pk-display font-bold text-[28px] tracking-tight text-pk-surface-50">Explorar Pokédex</h1>
              <p className="text-pk-surface-400 text-sm mt-1 max-w-[600px]">
                {pokemonList.length} Pokémon registrados. Haz clic en cualquiera para ver su ficha completa.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-pk-surface-400 font-pk-mono">
              <span>
                Total<b className="ml-1 text-pk-surface-100">{pokemonList.length}</b>
              </span>
              <span>
                Resultados<b className="ml-1 text-pk-surface-100">{filteredPokemon.length}</b>
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 pb-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pk-surface-500" />
            <input
              type="search"
              placeholder="Buscar por nombre o número…"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] py-2.5 pr-3 pl-9 text-[13px] text-pk-surface-50 outline-none placeholder:text-pk-surface-500 focus:border-pk-primary-400/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6">
          {filteredPokemon.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
              {filteredPokemon.map((pokemon) => {
                const isSeen = getDisplayStatus(pokemon.dex, "base", true)
                return (
                  <Link href={`/smartrotom/pokedex/entrada/${pokemon.dex}`} key={pokemon.dex} className="block">
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 hover:bg-white/[0.04] hover:border-pk-primary-400/20 transition-all flex flex-col items-center group">
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
                        <div className="font-pk-mono text-[10px] text-pk-surface-500">#{pokemon.dex.toString().padStart(3, "0")}</div>
                        <div className="text-pk-surface-100 text-xs font-medium truncate w-full">
                          {isSeen ? t(`pixelmon_${pokemon.name.toLowerCase()}`) || pokemon.name : "???"}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center">
              <p className="text-pk-surface-400 text-sm">No se encontraron Pokémon que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
