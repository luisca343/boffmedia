import { useRotomRequest } from "@/hooks/useRotomRequest"
import { appsService } from "@/services/api/smartrotom/appsService"
import type { SuccessResponse } from "@/types"

export function useAddAppToPlayer() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.addAppToPlayer)

  const addAppToPlayer = (uuid: string, appId: number) => {
    return appsService.addAppToPlayer(uuid, appId)
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

