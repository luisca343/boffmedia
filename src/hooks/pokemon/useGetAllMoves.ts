import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAllMoves() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getAllMoves)

  return {
    moves: data,
    error,
    isLoading,
    refetch,
    setMoves: setData,
  }
}

