import { UpdateProgressDto } from "@/generated/api"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useUpdateProgress(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (updateProgressDto) => eventsService.updateProgress(eventId, updateProgressDto),
    [eventId],
  )

  const updateProgress = (updateProgressDto: UpdateProgressDto) => {
    return eventsService.updateProgress(eventId, updateProgressDto)
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

