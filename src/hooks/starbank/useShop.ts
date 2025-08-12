import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";
import { CreateShopTransactionDto } from "@/types/dto/create-shop-transaction-dto";

export function useShop() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.shopTransaction)

  const shop = (transactionData: CreateShopTransactionDto) => {
    return StarbankService.shopTransaction(transactionData);
  }

  return {
    shopResult: data,
    error,
    isLoading,
    refetch,
    shop,
    setShopResult: setData
  }
}

