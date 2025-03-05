import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetImage(params: {
  pokemonId: number
  formName: string
  paletteName: string
  uuid: string
  hide: number
}) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getImage, params)

  return {
    image: data,
    error,
    isLoading,
    refetch,
    setImage: setData,
  }
}

