import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";

export function useGetAllAccounts() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.getAllAccounts)

  return {
    accounts: data,
    error,
    isLoading,
    refetch,
    setAccounts: setData
  }
}

