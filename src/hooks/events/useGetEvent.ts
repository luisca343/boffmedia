import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetEvent(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(() => EventsService.getEvent(id), [id])

  return {
    event: data,
    error,
    isLoading,
    refetch,
    setEvent: setData,
  }
}

