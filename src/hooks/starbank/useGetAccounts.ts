import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";

export function useGetAccounts(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.getAccounts, uuid)

  return {
    accounts: data,
    error,
    isLoading,
    refetch,
    setAccounts: setData
  }
}

