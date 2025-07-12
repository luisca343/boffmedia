import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useClaim(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.claimRewards, { uuid })

  return {
    claim: data,
    error,
    isLoading,
    refetch,
    setClaim: setData
  }
}

