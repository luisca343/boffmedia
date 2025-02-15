import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import { CreateEventDto } from "@/types/dto/create-event.dto"

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

