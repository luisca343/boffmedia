import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetPokemonByAbility(name: string) {
  const { data, error, isLoading, refetch } = useRotomRequest(pokemonService.getPokemonByAbility, name)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
  }
}