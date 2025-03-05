import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByDex(dex: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getPokemonByDex, dex)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

