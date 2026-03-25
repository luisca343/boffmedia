import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByAbility(name: string) {
  const { data, error, isLoading, refetch } = useRotomRequest(PokemonService.getPokemonByAbility, name)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
  }
}