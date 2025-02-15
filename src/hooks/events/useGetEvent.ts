import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useGetEvent(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(() => eventsService.getEvent(id), [id])

  return {
    event: data,
    error,
    isLoading,
    refetch,
    setEvent: setData,
  }
}

