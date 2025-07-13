import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";

export function useGetTransfers(account: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.getTransfers, account)

  return {
    transfers: data,
    error,
    isLoading,
    refetch,
    setTransfers: setData
  }
}

