import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAllAbilities() {
  const { data, error, isLoading, refetch } = useRotomRequest(PokemonService.getAllAbilities)

  return {
    abilities: data,
    error,
    isLoading,
    refetch,
  }
}