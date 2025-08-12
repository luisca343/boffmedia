import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAllMoves() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getAllMoves)

  return {
    moves: data,
    error,
    isLoading,
    refetch,
    setMoves: setData,
  }
}

