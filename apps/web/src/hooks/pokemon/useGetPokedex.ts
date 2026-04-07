import { useEffect } from "react"
import type { PokedexData } from "@/types/pokedex"
import { usePokemonStore } from "@/stores/pokemonStore"

export function useGetPokedex(uuid: string) {
  const { pokedexData, fetchPokedex, updatePokedexData, fetchingPokedex } = usePokemonStore()

  useEffect(() => {
    if (!pokedexData && !fetchingPokedex && uuid) {
      fetchPokedex(uuid)
    }
  }, [uuid, pokedexData, fetchingPokedex]) // Removed fetchPokedex from dependencies

  const isLoading = !pokedexData || fetchingPokedex
  const error = null // We're not handling errors in the store, so this will always be null

  const refetch = () => {
    if (uuid) {
      fetchPokedex(uuid)
    }
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

