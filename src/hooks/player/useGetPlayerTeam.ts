import { useRotomRequest } from "@/hooks/useRotomRequest"
import { playerService } from "@/services/api/smartrotom/playerService"

export function useGetPlayerTeam(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(playerService.getTeam, uuid)

  return {
    playerTeam: data,
    error,
    isLoading,
    refetch,
    setPlayerTeam: setData,
  }
}

