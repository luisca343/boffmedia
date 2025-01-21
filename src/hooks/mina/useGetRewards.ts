import { useRotomRequest } from "../useRotomRequest";
import { minaService } from "@/services/api/smartrotom/minaService";

export function useGetRewards() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(minaService.getRewards)

  return {
    rewards: data,
    error,
    isLoading,
    refetch,
    setRewards: setData
  }
}

