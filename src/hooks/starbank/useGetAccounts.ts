import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";

export function useGetAccounts(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.getAccounts, uuid)

  return {
    accounts: data,
    error,
    isLoading,
    refetch,
    setAccounts: setData
  }
}

