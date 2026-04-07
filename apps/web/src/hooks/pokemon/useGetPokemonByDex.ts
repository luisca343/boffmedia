import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByDex(dex: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getPokemonByDex, dex)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

