import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetEvents() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.getEvents)

  return {
    events: data || [],
    error,
    isLoading,
    refetch,
    setEvents: setData,
  }
}

