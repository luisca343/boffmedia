import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";

export function useGetAllAccounts() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.getAllAccounts)

  return {
    accounts: data,
    error,
    isLoading,
    refetch,
    setAccounts: setData
  }
}

