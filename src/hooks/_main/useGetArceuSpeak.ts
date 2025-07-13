import { useRotomRequest } from "@/hooks/useRotomRequest"
import { SmartrotomService } from "@/services/api/smartrotom/smartrotomService"

export function useGetArceuSpeak() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(SmartrotomService.getArceuSpeak)

  return {
    speakers: data,
    error,
    isLoading,
    refetch,
    setArceuSpeak: setData,
  }
}

