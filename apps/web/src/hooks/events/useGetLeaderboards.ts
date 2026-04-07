import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetLeaderboards() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.getLeaderboards)

  return {
    leaderboards: data,
    error,
    isLoading,
    refetch,
    setLeaderboard: setData,
  }
}

