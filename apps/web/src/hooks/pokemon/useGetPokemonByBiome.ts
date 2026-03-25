import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByBiome(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getPokemonByBiome, name)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

