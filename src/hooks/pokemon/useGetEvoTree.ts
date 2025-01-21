import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetEvoTree(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getEvoTree, id)

  return {
    evoTree: data,
    error,
    isLoading,
    refetch,
    setEvoTree: setData,
  }
}

