import { useState, useEffect } from "react"
import { usePokemonStore } from "@/stores/pokemonStore"
import type { PokedexData } from "@/types/pokedex"
import { useBoffSession } from "@/services/useBoffSession"

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

  return {
    pokedexData,
    isLoading,
    error,
    refetch,
  }
}

