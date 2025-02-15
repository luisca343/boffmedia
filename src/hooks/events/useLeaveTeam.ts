import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useLeaveTeam(eventId: number, teamId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (userId) => eventsService.leaveTeam(eventId, teamId, userId),
    [eventId, teamId],
  )

  const leaveTeam = (userId: number) => {
    return eventsService.leaveTeam(eventId, teamId, userId)
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

