import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";
import { CreateAccountDto } from "@/types/dto/create-account-dto";

export function useCreateAccount() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.createAccount)

  const createAccount = (accountData: CreateAccountDto) => {
    return StarbankService.createAccount(accountData);
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

