import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetEventTeams(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => EventsService.getEventTeams(eventId),
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

