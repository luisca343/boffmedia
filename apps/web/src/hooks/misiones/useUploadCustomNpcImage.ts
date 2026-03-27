import { useRotomRequest } from "@/hooks/useRotomRequest"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import { UploadNpcImageDto } from "@boffmedia/shared"

export function useUploadCustomNpcImage() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MisionesService.uploadCustomNpcImage)

  const uploadImage = (imageData: UploadNpcImageDto) => {
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

