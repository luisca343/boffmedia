import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";

export function useGetBalance(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.getBalance, uuid)

  return {
    balance: data,
    error,
    isLoading,
    refetch,
    setBalance: setData
  }
}

