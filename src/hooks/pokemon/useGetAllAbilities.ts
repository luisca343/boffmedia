import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAllAbilities() {
  const { data, error, isLoading, refetch } = useRotomRequest(pokemonService.getAllAbilities)

  return {
    abilities: data,
    error,
    isLoading,
    refetch,
  }
}