import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetNextPrev(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getNextPrev, id)

  return {
    nextPrev: data,
    error,
    isLoading,
    refetch,
    setNextPrev: setData,
  }
}

