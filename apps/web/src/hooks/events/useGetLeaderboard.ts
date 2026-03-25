import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetLeaderboard(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => EventsService.getLeaderboard(eventId),
    [eventId],
  )

  return {
    leaderboard: data || [],
    error,
    isLoading,
    refetch,
    setLeaderboard: setData,
  }
}

