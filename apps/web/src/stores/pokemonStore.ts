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
  fetchingPokedex: boolean
  currentPokedexUuid: string | null
  pokedexFetchedAt: number | null
  fetchPokedex: (uuid: string) => Promise<PokedexData | void>
  updatePokedexData: (newData: PokedexData) => void
  invalidatePokedex: () => void
  fetchAllPokemon: () => Promise<void>
  getPokemonByDex: (dex: number) => Promise<Pokemon | undefined>
  getPokedexData: (uuid: string) => Promise<PokedexData | null>
}

// Store pending promises to avoid duplicate fetches
const pendingFetches = new Map<string, Promise<PokedexData | void>>()

// The app can stay open for hours in MCEF, so the snapshot must expire — the dex changes
// server-side and an unbounded cache shows a caught Pokémon as a silhouette forever.
const POKEDEX_TTL_MS = 30_000

export const usePokemonStore = create<PokemonState>((set, get) => ({
  console: "PokemonStore initialized",
  pokedexData: null,
  allPokemon: [],
  pokemonByDex: {},
  isLoading: false,
  error: null,
  fetchingPokedex: false,
  currentPokedexUuid: null,
  pokedexFetchedAt: null,

  fetchPokedex: async (uuid: string) => {
    const { fetchingPokedex, currentPokedexUuid, pokedexData, pokedexFetchedAt } = get()

    if (
      pokedexData &&
      currentPokedexUuid === uuid &&
      pokedexFetchedAt !== null &&
      Date.now() - pokedexFetchedAt < POKEDEX_TTL_MS
    ) {
      return pokedexData
    }

    // If there's already a fetch in progress for this UUID, wait for it
    if (pendingFetches.has(uuid)) {
      return pendingFetches.get(uuid)
    }

    // If already fetching a different UUID, wait for it to complete
    if (fetchingPokedex) {
      return new Promise((resolve) => {
        const checkComplete = () => {
          const currentState = get()
          if (!currentState.fetchingPokedex) {
            resolve()
          } else {
            setTimeout(checkComplete, 100)
          }
        }
        checkComplete()
      })
    }

    set({ isLoading: true, error: null, fetchingPokedex: true })
    
    const fetchPromise = PokemonService.getDetailedPokedexStatus(uuid)
      .then(response => {
        // An HTTP error resolves to `{ success: false }` with no data; writing it through
        // would blank a dex that was working.
        if (response.success !== true || !response.data) {
          set({
            error: "Failed to fetch Pokedex data",
            isLoading: false,
            fetchingPokedex: false,
          })
          pendingFetches.delete(uuid)
          return get().pokedexData ?? undefined
        }

        set({
          pokedexData: response.data,
          isLoading: false,
          fetchingPokedex: false,
          currentPokedexUuid: uuid,
          pokedexFetchedAt: Date.now()
        })
        pendingFetches.delete(uuid)
        return response.data
      })
      .catch(error => {
        set({ error: "Failed to fetch Pokedex data", isLoading: false, fetchingPokedex: false })
        pendingFetches.delete(uuid)
        throw error
      })
    
    pendingFetches.set(uuid, fetchPromise)
    return fetchPromise
  },

  updatePokedexData: (newData: PokedexData) => {
    set({ pokedexData: newData, pokedexFetchedAt: Date.now() })
  },

  // Marks the snapshot stale without clearing it, so the dex stays on screen until it reloads.
  invalidatePokedex: () => {
    set({ pokedexFetchedAt: null })
  },

  fetchAllPokemon: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await PokemonService.getPokemon()
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
    await get().fetchPokedex(uuid)
    return get().pokedexData
  },
}))

