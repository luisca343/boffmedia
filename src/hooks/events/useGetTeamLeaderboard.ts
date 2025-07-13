import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"

export function useGetTeamLeaderboard(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => eventsService.getTeamLeaderboard(eventId),
    [eventId],
  )

  return {
    teamLeaderboard: data || [],
    error,
    isLoading,
    refetch,
    setTeamLeaderboard: setData,
  }
}

