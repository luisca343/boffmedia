import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useSearchPokemonByName(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.searchPokemon, name)

  return {
    searchResults: data,
    error,
    isLoading,
    refetch,
    setSearchResults: setData,
  }
}

