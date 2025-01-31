import { useRotomRequest } from "@/hooks/useRotomRequest"
import { appsService } from "@/services/api/smartrotom/appsService"
import type { SuccessResponse } from "@/types"

export function useRemoveAppFromPlayer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.removeAppFromPlayer)

  const removeAppFromPlayer = (uuid: string, appId: number) => {
    return appsService.removeAppFromPlayer(uuid, appId)
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

