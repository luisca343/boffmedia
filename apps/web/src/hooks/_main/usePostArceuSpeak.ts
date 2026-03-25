import { useRotomRequest } from "@/hooks/useRotomRequest"
import { SmartrotomService } from "@/services/api/smartrotom/smartrotomService"
import type { ApiResponse } from "@/services/boffAPI"

export function usePostArceuSpeak() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(SmartrotomService.postArceuSpeak)

  const postArceuSpeak = (name: string, value: string, format: string) => {
    return SmartrotomService.postArceuSpeak({name, value, format})
  }

  return {
    response: data,
    error,
    isLoading,
    refetch,
    postArceuSpeak,
    setResponse: setData,
  }
}

