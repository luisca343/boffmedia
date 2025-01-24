import { create } from "zustand"
import type { PokedexData } from "@/types/pokedex"
import type { Pokemon } from "@/app/smartrotom/pokedex/_types/pokemon"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

interface PokemonState {
  pokedexData: PokedexData | null
  allPokemon: Pokemon[]
  pokemonByDex: Record<number, Pokemon>
  fetchPokedex: (uuid: string) => Promise<void>
  updatePokedexData: (newData: PokedexData) => void
  fetchAllPokemon: () => Promise<void>
  getPokemonByDex: (dex: number) => Promise<Pokemon | undefined>
}

export const usePokemonStore = create<PokemonState>((set, get) => ({
  pokedexData: null,
  allPokemon: [],
  pokemonByDex: {},

  fetchPokedex: async (uuid: string) => {
    const response = await pokemonService.getPokedexStatus(uuid)
    set({ pokedexData: response.data })
  },

  updatePokedexData: (newData: PokedexData) => {
    set({ pokedexData: newData })
  },

  fetchAllPokemon: async () => {
    const response = await pokemonService.getAllPokemon()
    const pokemonList = response.data as Pokemon[]
    const pokemonMap = pokemonList.reduce(
      (acc, pokemon) => {
        acc[pokemon.dex] = pokemon
        return acc
      },
      {} as Record<number, Pokemon>,
    )
    set({
      allPokemon: pokemonList,
      pokemonByDex: pokemonMap,
    })
  },

  getPokemonByDex: async (dex: number) => {
    const { pokemonByDex } = get()
    if (pokemonByDex[dex]) {
      return pokemonByDex[dex]
    }
    const response = await pokemonService.getPokemonByDex(dex)
    const pokemon = response.data
    set((state) => ({
      pokemonByDex: { ...state.pokemonByDex, [dex]: pokemon as Pokemon },
    }))
    return pokemon
  },
}))

