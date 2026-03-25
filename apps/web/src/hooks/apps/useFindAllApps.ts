import { useRotomRequest } from "../useRotomRequest";
import { AppsService } from "@/services/api/smartrotom/appsService";

export function useFindAllApps() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.findAll)

  return {
    apps: data,
    error,
    isLoading,
    refetch,
    setApps: setData
  }
}

