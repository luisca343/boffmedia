import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";
import { CreateShopTransactionDto } from "@/types/dto/create-shop-transaction-dto";

export function useShop() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.shop)

  const shop = (transactionData: CreateShopTransactionDto) => {
    return starbankService.shop(transactionData);
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

