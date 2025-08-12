import { useRotomRequest } from "@/hooks/useRotomRequest"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import { NpcImageDto } from "@/types/dto/npc-image-dto"

export function useUploadCustomNpcImage() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MisionesService.uploadCustomNpcImage)

  const uploadImage = (imageData: NpcImageDto) => {
    return MisionesService.uploadCustomNpcImage(imageData)
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

