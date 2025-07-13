import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"
import { CreateTeamDto } from "@/types/dto/create-team.dto"
export function useCreateTeam(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (createTeamDto) => eventsService.createTeam(eventId, createTeamDto),
    [eventId],
  )

  const createTeam = (createTeamDto: CreateTeamDto) => {
    return eventsService.createTeam(eventId, createTeamDto)
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

