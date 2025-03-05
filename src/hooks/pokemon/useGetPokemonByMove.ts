import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByMove(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getPokemonByMove, name)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

