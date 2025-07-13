import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetRegistries(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getRegistries, uuid)

  return {
    registries: data,
    error,
    isLoading,
    refetch,
    setRegistries: setData,
  }
}

