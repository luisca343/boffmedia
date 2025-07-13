import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"

export function useGetEventTeams(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => eventsService.getEventTeams(eventId),
    [eventId],
  )

  return {
    teams: data || [],
    error,
    isLoading,
    refetch,
    setTeams: setData,
  }
}

