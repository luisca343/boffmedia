import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetSprite(params: {
  pokemonId: number
  formName: string
  paletteName: string
  uuid: string
  hide: number
}) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getSprite, params)

  return {
    sprite: data,
    error,
    isLoading,
    refetch,
    setSprite: setData,
  }
}

