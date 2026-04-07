import { useRotomRequest } from "@/hooks/useRotomRequest"
import { WingullService } from "@/services/api/smartrotom/wingullService"

export function useGetPlayerTeam(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(WingullService.getTeam, uuid)

  return {
    playerTeam: data,
    error,
    isLoading,
    refetch,
    setPlayerTeam: setData,
  }
}

