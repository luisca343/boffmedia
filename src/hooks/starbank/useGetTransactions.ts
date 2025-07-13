import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";

export function useGetTransactions(account: number, limit?: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.getTransactions, account, limit)

  return {
    transactions: data,
    error,
    isLoading,
    refetch,
    setTransactions: setData
  }
}

