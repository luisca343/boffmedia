import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useJoinTeam(eventId: number, teamId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (userId) => eventsService.joinTeam(eventId, teamId, userId),
    [eventId, teamId],
  )

  const joinTeam = (userId: number) => {
    return eventsService.joinTeam(eventId, teamId, userId)
  }

  return {
    joinResult: data,
    error,
    isLoading,
    refetch,
    joinTeam,
    setJoinResult: setData,
  }
}

