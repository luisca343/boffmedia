import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAbility(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getAbility, name)

  return {
    ability: data,
    error,
    isLoading,
    refetch,
    setAbility: setData,
  }
}