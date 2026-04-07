import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAllPokemon() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getPokemon)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

