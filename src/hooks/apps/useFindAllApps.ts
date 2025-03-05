import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";

export function useFindAllApps() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.findAll)

  return {
    apps: data,
    error,
    isLoading,
    refetch,
    setApps: setData
  }
}

