import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useGetRewards() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.getAllRewards)

  return {
    rewards: data,
    error,
    isLoading,
    refetch,
    setRewards: setData
  }
}

