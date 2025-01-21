import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByBiome(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getPokemonByBiome, name)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

