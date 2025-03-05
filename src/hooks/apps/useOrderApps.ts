import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";
import { OrderAppDto } from "@/types/dto/order-apps.dto";

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

