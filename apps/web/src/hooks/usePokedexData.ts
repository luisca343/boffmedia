import { useState, useEffect } from "react"
import { usePokemonStore } from "@/stores/pokemonStore"
import type { PokedexData } from "@/types/pokedex"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { PokedexStatus } from "@/app/smartrotom/pokedex/dexUtils"

export function usePokedexData() {
  const uuid = useRotomUuid()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getPokedexData = usePokemonStore((state) => state.getPokedexData)
  const pokedexData = usePokemonStore((state) => state.pokedexData)
  const fetchingPokedex = usePokemonStore((state) => state.fetchingPokedex)
  

  useEffect(() => {
    async function fetchData() {
      if (fetchingPokedex) return // Don't start a new fetch if one is already in progress

      // The layout swaps the whole app for a spinner while this is true, so a revalidation
      // must not set it.
      const isFirstLoad = !usePokemonStore.getState().pokedexData

      if (isFirstLoad) setIsLoading(true)
      setError(null)
      try {
        await getPokedexData(uuid!)
      } catch (err) {
        setError("Failed to fetch Pokedex data")
      } finally {
        if (isFirstLoad) setIsLoading(false)
      }
    }

    // Runs on every mount: a capture registered in-game is only visible once this re-reads.
    if (uuid) {
      fetchData()
    }
  }, [uuid, pokedexData, fetchingPokedex])

  const refetch = async () => {
    if (!uuid) return

    setIsLoading(true)
    setError(null)
    try {
      await getPokedexData(uuid)
    } catch (err) {
      setError("Failed to fetch Pokedex data")
    } finally {
      setIsLoading(false)
    }
  }
  
  const isCaught = (pokemonId: number, form: string): boolean => {
    if (!pokedexData) return false
    return pokedexData.caughtPokemon.includes(`${pokemonId}:${form}`)
  }

  const isSeen = (pokemonId: number, form: string): boolean => {
    if (!pokedexData) return false
    return pokedexData.seenPokemon.includes(`${pokemonId}:${form}`)
  }

  // New function to get Pokémon status
  const getPokemonStatus = (pokemonId: number, form: string): PokedexStatus => {
    if (!pokedexData) return PokedexStatus.UNSEEN
    
    const key = `${pokemonId}:${form}`
    
    if (pokedexData.caughtPokemon.includes(key)) {
      if (pokedexData.shinyPokemon.includes(key)) {
        return PokedexStatus.SHINY
      }
      return PokedexStatus.CAUGHT
    }
    
    if (pokedexData.seenPokemon.includes(key)) {
      return PokedexStatus.SEEN
    }
    
    return PokedexStatus.UNSEEN
  }

  const getVisibility = (pokemonId: number, form: string, hideCaught: boolean, hideSeen: boolean): boolean => {
    const status = getPokemonStatus(pokemonId, form)
    
    if (hideCaught && status === PokedexStatus.CAUGHT) return false
    if (hideSeen && status === PokedexStatus.SEEN) return false
    return true
  }

  return {
    pokedexData,
    isLoading,
    error,
    refetch,
    isCaught,
    isSeen,
    getPokemonStatus,
    getVisibility
  }
}