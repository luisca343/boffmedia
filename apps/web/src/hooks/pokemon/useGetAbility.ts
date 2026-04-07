import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAbility(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getAbility, name)

  return {
    ability: data,
    error,
    isLoading,
    refetch,
    setAbility: setData,
  }
}