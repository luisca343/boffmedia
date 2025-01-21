import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetSprite(params: {
  pokemonId: number
  formName: string
  paletteName: string
  uuid: string
  hide: number
}) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getSprite, params)

  return {
    sprite: data,
    error,
    isLoading,
    refetch,
    setSprite: setData,
  }
}

