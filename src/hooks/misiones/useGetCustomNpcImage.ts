import { useRotomRequest } from "@/hooks/useRotomRequest"
import { misionesService } from "@/services/api/smartrotom/misionesService"

export function useGetCustomNpcImage() {
  const {
    data: renderData,
    error: renderError,
    isLoading: renderLoading,
    refetch: refetchRender,
    setData: setRenderData,
  } = useRotomRequest(misionesService.getCustomNpcRender)
  const {
    data: imageData,
    error: imageError,
    isLoading: imageLoading,
    refetch: refetchImage,
    setData: setImageData,
  } = useRotomRequest(misionesService.getCustomNpcImage)

  const getRender = (npcName: string) => {
    return misionesService.getCustomNpcRender(npcName)
  }

  const getImage = (npcName: string) => {
    return misionesService.getCustomNpcImage(npcName)
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

