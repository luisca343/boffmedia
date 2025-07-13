import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useSearchPokemonByName(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.searchPokemonByName, name)

  return {
    searchResults: data,
    error,
    isLoading,
    refetch,
    setSearchResults: setData,
  }
}

