import { useRotomRequest } from "@/hooks/useRotomRequest"
import { SmartrotomService } from "@/services/api/smartrotom/smartrotomService"

export function useGetPerformance() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(SmartrotomService.getPerformance)

  
  return {
    performance: data,
    error,
    isLoading,
    refetch,
    setPerformance: setData,
  }
}

