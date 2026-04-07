import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonNames() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getPokemonNames)

  return {
    names: data,
    error,
    isLoading,
    refetch,
    setNames: setData,
  }
}

