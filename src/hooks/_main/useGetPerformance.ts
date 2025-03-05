import { useRotomRequest } from "@/hooks/useRotomRequest"
import { smartrotomService } from "@/services/api/smartrotom/smartrotomService"

export function useGetPerformance() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(smartrotomService.getPerformance)

  
  return {
    performance: data,
    error,
    isLoading,
    refetch,
    setPerformance: setData,
  }
}

