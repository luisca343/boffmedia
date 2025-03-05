import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useGetLeaderboards() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.getLeaderboards)

  return {
    leaderboards: data,
    error,
    isLoading,
    refetch,
    setLeaderboard: setData,
  }
}

