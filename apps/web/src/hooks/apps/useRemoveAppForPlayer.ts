import { useRotomRequest } from "@/hooks/useRotomRequest"
import { AppsService } from "@/services/api/smartrotom/appsService"

export function useRemoveAppFromPlayer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.removeAppFromPlayer)

  const removeAppFromPlayer = (uuid: string, appId: number) => {
    return AppsService.removeAppFromPlayer(uuid, appId)
  }

  return {
    removeResult: data,
    error,
    isLoading,
    refetch,
    removeAppFromPlayer,
    setRemoveResult: setData,
  }
}

