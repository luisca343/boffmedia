import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useJoinTeam(eventId: number, teamId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (userId) => EventsService.joinTeam(eventId, teamId, userId),
    [eventId, teamId],
  )

  const joinTeam = (userId: number) => {
    return EventsService.joinTeam(eventId, teamId, {participantId: userId})
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

