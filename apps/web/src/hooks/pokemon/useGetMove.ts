import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetMove(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getMove, name)

  return {
    move: data,
    error,
    isLoading,
    refetch,
    setMove: setData,
  }
}

