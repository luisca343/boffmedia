import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";

export function useGetAppsForPlayer(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.getForPlayer, uuid)

  return {
    apps: data || [],
    error,
    isLoading,
    refetch,
    setApps: setData
  }
}

