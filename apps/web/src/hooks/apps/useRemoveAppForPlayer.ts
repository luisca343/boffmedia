import { useRotomRequest } from "@/hooks/useRotomRequest"
import { AppsService } from "@/services/api/smartrotom/appsService"

export function useRemoveAppFromPlayer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.removeAppFromPlayer)

  // The owner is the signed-in player; the API reads it from the session.
  const removeAppFromPlayer = (appId: number) => {
    return AppsService.removeAppFromPlayer(appId)
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

