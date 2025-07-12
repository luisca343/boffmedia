import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useGetRewardsByType() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.getRewardsByType)

  return {
    rewardsByType: data,
    error,
    isLoading,
    refetch,
    setRewardsByType: setData
  }
}

