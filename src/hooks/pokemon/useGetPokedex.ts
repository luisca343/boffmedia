import { useEffect } from "react"
import type { PokedexData } from "@/types/pokedex"
import { usePokemonStore } from "@/stores/pokemonStore"

export function useGetPokedex(uuid: string) {
  const { pokedexData, fetchPokedex, updatePokedexData } = usePokemonStore()

  useEffect(() => {
    if (!pokedexData) {
      fetchPokedex(uuid)
    }
  }, [uuid, pokedexData, fetchPokedex])

  const isLoading = !pokedexData
  const error = null // We're not handling errors in the store, so this will always be null

  const refetch = () => {
    fetchPokedex(uuid)
  }

  const setRegistries = (newData: PokedexData) => {
    updatePokedexData(newData)
  }

  return {
    pokedexData,
    error,
    isLoading,
    refetch,
    setRegistries,
  }
}

