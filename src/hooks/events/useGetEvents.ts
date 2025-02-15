import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useGetEvents() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.getEvents)

  return {
    events: data || [],
    error,
    isLoading,
    refetch,
    setEvents: setData,
  }
}

