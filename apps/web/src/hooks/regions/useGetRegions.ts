import { useRotomRequest } from "@/hooks/useRotomRequest"
import { regionService } from "@/services/api/smartrotom/regionService"

export function useGetRegions() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(regionService.getRegions)

  return {
    regions: data,
    error,
    isLoading,
    refetch,
    setRegions: setData,
  }
}

