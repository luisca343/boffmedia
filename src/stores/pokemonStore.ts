import { create } from "zustand"
import type { PokedexData } from "@/types/pokedex"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { Pokemon } from "@/types/Pokemon"

interface PokemonState {
  pokedexData: PokedexData | null
  allPokemon: Pokemon[]
  pokemonByDex: Record<number, Pokemon>
  isLoading: boolean
  error: string | null
  fetchPokedex: (uuid: string) => Promise<void>
  updatePokedexData: (newData: PokedexData) => void
  fetchAllPokemon: () => Promise<void>
  getPokemonByDex: (dex: number) => Promise<Pokemon | undefined>
  getPokedexData: (uuid: string) => Promise<PokedexData | null>
}

export const usePokemonStore = create<PokemonState>((set, get) => ({
  console: "PokemonStore initialized",
  pokedexData: null,
  allPokemon: [],
  pokemonByDex: {},
  isLoading: false,
  error: null,

  fetchPokedex: async (uuid: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await PokemonService.getPokedexStatus(uuid)
      set({ pokedexData: response.data, isLoading: false })
    } catch (error) {
      set({ error: "Failed to fetch Pokedex data", isLoading: false })
    }
  },

  updatePokedexData: (newData: PokedexData) => {
    set({ pokedexData: newData })
  },

  fetchAllPokemon: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await PokemonService.getAllPokemon()
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
        isLoading: false,
      })
    } catch (error) {
      set({ error: "Failed to fetch all Pokemon", isLoading: false })
    }
  },

  getPokemonByDex: async (dex: number) => {
    const { pokemonByDex } = get()
    if (pokemonByDex[dex]) {
      return pokemonByDex[dex]
    }
    set({ isLoading: true, error: null })
    try {
      const response = await PokemonService.getPokemonByDex(dex)
      const pokemon = response.data
      set((state) => ({
        pokemonByDex: { ...state.pokemonByDex, [dex]: pokemon as Pokemon },
        isLoading: false,
      }))
      return pokemon
    } catch (error) {
      set({ error: `Failed to fetch Pokemon with dex ${dex}`, isLoading: false })
      return undefined
    }
  },

  getPokedexData: async (uuid: string) => {
    const { pokedexData } = get()
    if (pokedexData) {
      return pokedexData
    }
    await get().fetchPokedex(uuid)
    return get().pokedexData
  },
}))

