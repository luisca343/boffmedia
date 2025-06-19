import { OrderAppDto } from "@/generated/api";
import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";
export function useOrderApps() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.order)

  const orderApps = (orderAppDto: OrderAppDto) => {
    return appsService.order(orderAppDto);
  }

  return {
    order: data,
    error,
    isLoading,
    refetch,
    orderApps,
    setOrder: setData
  }
}

