import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { CreateTeamDto } from "@/types/dto/create-team.dto"
export function useCreateTeam(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (createTeamDto) => EventsService.createTeam(eventId, createTeamDto),
    [eventId],
  )

  const createTeam = (createTeamDto: CreateTeamDto) => {
    return EventsService.createTeam(eventId, createTeamDto)
  }

  return {
    createdTeam: data,
    error,
    isLoading,
    refetch,
    createTeam,
    setCreatedTeam: setData,
  }
}

