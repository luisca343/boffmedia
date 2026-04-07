import { OrderAppDto } from "@boffmedia/shared";
import { useRotomRequest } from "../useRotomRequest";
import { AppsService } from "@/services/api/smartrotom/appsService";
export function useOrderApps() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.order)

  const orderApps = (orderAppDto: OrderAppDto) => {
    return AppsService.order(orderAppDto);
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

