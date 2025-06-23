import { CreateEventDto } from "@/generated/api"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useCreateEvent() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.createEvent)

  const createEvent = (createEventDto: CreateEventDto) => {
    return eventsService.createEvent(createEventDto)
  }

  return {
    createdEvent: data,
    error,
    isLoading,
    refetch,
    createEvent,
    setCreatedEvent: setData,
  }
}

