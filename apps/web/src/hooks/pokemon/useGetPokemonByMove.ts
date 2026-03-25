import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByMove(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getPokemonByMove, name)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

