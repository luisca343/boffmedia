import { UpdateProgressDto } from "@/generated/api"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useUpdateProgress(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (updateProgressDto) => EventsService.updateProgress(eventId, updateProgressDto),
    [eventId],
  )

  const updateProgress = (updateProgressDto: UpdateProgressDto) => {
    return EventsService.updateProgress(eventId, updateProgressDto)
  }

  return {
    updateResult: data,
    error,
    isLoading,
    refetch,
    updateProgress,
    setUpdateResult: setData,
  }
}

