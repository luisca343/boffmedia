import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";

export function useGetBalance(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.getUserBalance, uuid)

  return {
    balance: data,
    error,
    isLoading,
    refetch,
    setBalance: setData
  }
}

