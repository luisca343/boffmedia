import { CreateEventDto } from "@boffmedia/shared"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useCreateEvent() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.createEvent)

  const createEvent = (createEventDto: CreateEventDto) => {
    return EventsService.createEvent(createEventDto)
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

