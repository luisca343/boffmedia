import { useRotomRequest } from "@/hooks/useRotomRequest"
import { PlayerService } from "@/services/api/smartrotom/playerService"

export function useGetPlayerStats(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PlayerService.getStats, uuid)
  
  return {
    playerStats: data?.stats,
    error,
    isLoading,
    refetch,
    setPlayerStats: setData,
  }
}

