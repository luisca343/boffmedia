import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetNextPrev(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getNextPrev, id)

  return {
    nextPrev: data,
    error,
    isLoading,
    refetch,
    setNextPrev: setData,
  }
}

