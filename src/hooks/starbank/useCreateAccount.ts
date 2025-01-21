import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";
import { CreateAccountDto } from "@/types/dto/create-account-dto";

export function useCreateAccount() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.createAccount)

  const createAccount = (accountData: CreateAccountDto) => {
    return starbankService.createAccount(accountData);
  }

  return {
    createdAccount: data,
    error,
    isLoading,
    refetch,
    createAccount,
    setCreatedAccount: setData
  }
}

