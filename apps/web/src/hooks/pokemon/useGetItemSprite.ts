import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetItemSprite(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getItemSprite, name)

  return {
    sprite: data,
    error,
    isLoading,
    refetch,
    setSprite: setData,
  }
}

