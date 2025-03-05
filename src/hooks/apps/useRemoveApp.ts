import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";

export function useRemoveApp() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.remove)

  const removeApp = (id: number) => {
    return appsService.remove(id);
  }

  return {
    removedApp: data,
    error,
    isLoading,
    refetch,
    removeApp,
    setRemovedApp: setData
  }
}

