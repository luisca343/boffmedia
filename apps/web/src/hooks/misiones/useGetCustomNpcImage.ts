import { useRotomRequest } from "@/hooks/useRotomRequest"
import { MisionesService } from "@/services/api/smartrotom/misionesService"

export function useGetCustomNpcImage() {
  const {
    data: renderData,
    error: renderError,
    isLoading: renderLoading,
    refetch: refetchRender,
    setData: setRenderData,
  } = useRotomRequest(MisionesService.getCustomNpcRender)
  const {
    data: imageData,
    error: imageError,
    isLoading: imageLoading,
    refetch: refetchImage,
    setData: setImageData,
  } = useRotomRequest(MisionesService.getCustomNpcImage)

  const getRender = (npcName: string) => {
    return MisionesService.getCustomNpcRender(npcName)
  }

  const getImage = (npcName: string) => {
    return MisionesService.getCustomNpcImage(npcName)
  }

  return {
    renderData,
    renderError,
    renderLoading,
    refetchRender,
    setRenderData,
    getRender,
    imageData,
    imageError,
    imageLoading,
    refetchImage,
    setImageData,
    getImage,
  }
}

