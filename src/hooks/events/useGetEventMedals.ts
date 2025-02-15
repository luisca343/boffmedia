import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useGetEventMedals(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => eventsService.getEventMedals(eventId),
    [eventId],
  )

  return {
    medals: data || [],
    error,
    isLoading,
    refetch,
    setMedals: setData,
  }
}

