import { useRotomRequest } from "@/hooks/useRotomRequest"
import { AppsService } from "@/services/api/smartrotom/appsService"

export function useAddAppToPlayer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.addAppToPlayer)

  const addAppToPlayer = (uuid: string, appId: number) => {
    return AppsService.addAppToPlayer(uuid, appId)
  }

  return {
    addResult: data,
    error,
    isLoading,
    refetch,
    addAppToPlayer,
    setAddResult: setData,
  }
}

