import { useRotomRequest } from "../useRotomRequest";
import { minaService } from "@/services/api/smartrotom/minaService";

export function useGetRewardsByType() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(minaService.getRewardsByType)

  return {
    rewardsByType: data,
    error,
    isLoading,
    refetch,
    setRewardsByType: setData
  }
}

