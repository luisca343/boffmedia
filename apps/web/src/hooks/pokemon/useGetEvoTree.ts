import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetEvoTree(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getEvoTree, id)

  return {
    evoTree: data,
    error,
    isLoading,
    refetch,
    setEvoTree: setData,
  }
}

