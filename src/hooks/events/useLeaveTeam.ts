import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useLeaveTeam(eventId: number, teamId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (userId) => EventsService.leaveTeam(eventId, teamId, userId),
    [eventId, teamId],
  )

  const leaveTeam = (userId: number) => {
    return EventsService.leaveTeam(eventId, teamId, userId)
  }

  return {
    leaveResult: data,
    error,
    isLoading,
    refetch,
    leaveTeam,
    setLeaveResult: setData,
  }
}

