import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useSearchPokemonByName(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.searchPokemonByName, name)

  return {
    searchResults: data,
    error,
    isLoading,
    refetch,
    setSearchResults: setData,
  }
}

