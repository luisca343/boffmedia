import { useState, useEffect } from "react"
import { usePokemonStore } from "@/stores/pokemonStore"
import type { PokedexData } from "@/types/pokedex"
import { useBoffSession } from "@/services/useBoffSession"
import { PokedexStatus } from "@/app/smartrotom/pokedex/dexUtils"

export function usePokedexData() {
  const {session} = useBoffSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getPokedexData = usePokemonStore((state) => state.getPokedexData)
  const pokedexData = usePokemonStore((state) => state.pokedexData)
  

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        console.log(`Fetching Pokedex data for ${session.user.smartRotomUser?.uuid}`)
        await getPokedexData(session.user.smartRotomUser?.uuid!)
      } catch (err) {
        setError("Failed to fetch Pokedex data")
      } finally {
        setIsLoading(false)
      }
    }

    if (!pokedexData) {
      fetchData()
    }
  }, [session, getPokedexData, pokedexData])

  const refetch = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await getPokedexData(session.user.smartRotomUser?.uuid!)
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