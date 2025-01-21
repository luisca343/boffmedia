import { useRotomRequest } from "../useRotomRequest";
import { minaService } from "@/services/api/smartrotom/minaService";

export function useClaim(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(minaService.claim, { uuid })

  return {
    claim: data,
    error,
    isLoading,
    refetch,
    setClaim: setData
  }
}

