import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetMove(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getMove, name)

  return {
    move: data,
    error,
    isLoading,
    refetch,
    setMove: setData,
  }
}

