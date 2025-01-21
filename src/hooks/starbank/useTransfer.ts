import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";
import { CreateTransferDto } from "@/types/dto/create-transfer-dto";

export function useTransfer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.transfer)

  const transfer = (transferData: CreateTransferDto) => {
    return starbankService.transfer(transferData);
  }

  return {
    transferResult: data,
    error,
    isLoading,
    refetch,
    transfer,
    setTransferResult: setData
  }
}

