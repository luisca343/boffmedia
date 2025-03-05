import { useRotomRequest } from "@/hooks/useRotomRequest"
import { smartrotomService } from "@/services/api/smartrotom/smartrotomService"

export function useGetArceuSpeak() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(smartrotomService.getArceuSpeak)

  return {
    speakers: data,
    error,
    isLoading,
    refetch,
    setArceuSpeak: setData,
  }
}

