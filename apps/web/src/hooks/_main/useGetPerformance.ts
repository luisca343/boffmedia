import { useRotomRequest } from "@/hooks/useRotomRequest"
import { WingullService } from "@/services/api/smartrotom/wingullService"

export function useGetPerformance() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(WingullService.getPerformance)

  
  return {
    performance: data,
    error,
    isLoading,
    refetch,
    setPerformance: setData,
  }
}

