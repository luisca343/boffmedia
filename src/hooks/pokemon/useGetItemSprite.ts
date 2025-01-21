import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetItemSprite(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getItemSprite, name)

  return {
    sprite: data,
    error,
    isLoading,
    refetch,
    setSprite: setData,
  }
}

