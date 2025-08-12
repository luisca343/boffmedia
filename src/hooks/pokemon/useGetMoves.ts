import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetMoves(id: number, form: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getMoves, id, form)

  return {
    moves: data,
    error,
    isLoading,
    refetch,
    setMoves: setData,
  }
}

