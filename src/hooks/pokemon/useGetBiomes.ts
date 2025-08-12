import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetBiomes() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getBiomes)

  return {
    biomes: data,
    error,
    isLoading,
    refetch,
    setBiomes: setData,
  }
}

