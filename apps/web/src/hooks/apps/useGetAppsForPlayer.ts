import { useRotomRequest } from "../useRotomRequest";
import { AppsService } from "@/services/api/smartrotom/appsService";

export function useGetAppsForPlayer(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.getForPlayer, uuid)

  return {
    apps: data || [],
    error,
    isLoading,
    refetch,
    setApps: setData
  }
}

