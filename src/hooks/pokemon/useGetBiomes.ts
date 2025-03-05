import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetBiomes() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getBiomes)

  return {
    biomes: data,
    error,
    isLoading,
    refetch,
    setBiomes: setData,
  }
}

