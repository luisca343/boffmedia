import { useRotomRequest } from "@/hooks/useRotomRequest"
import { misionesService } from "@/services/api/smartrotom/misionesService"
import { NpcImageDto } from "@/types/dto/npc-image-dto"

export function useUploadCustomNpcImage() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(misionesService.uploadCustomNpcImage)

  const uploadImage = (imageData: NpcImageDto) => {
    return misionesService.uploadCustomNpcImage(imageData)
  }

  return {
    uploadedImage: data,
    error,
    isLoading,
    refetch,
    uploadImage,
    setUploadedImage: setData,
  }
}

