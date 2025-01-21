import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonNames() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getPokemonNames)

  return {
    names: data,
    error,
    isLoading,
    refetch,
    setNames: setData,
  }
}

