import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetRegistries(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getRegistries, uuid)

  return {
    registries: data,
    error,
    isLoading,
    refetch,
    setRegistries: setData,
  }
}

