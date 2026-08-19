import { useRotomRequest } from "@/hooks/useRotomRequest"
import { AppsService } from "@/services/api/smartrotom/appsService"

export function useAddAppToPlayer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AppsService.addAppToPlayer)

  // The owner is the signed-in player; the API reads it from the session.
  const addAppToPlayer = (appId: number) => {
    return AppsService.addAppToPlayer(appId)
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

