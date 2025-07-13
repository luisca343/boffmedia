import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetTeams() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.getTeams)

  return {
    teams: data,
    error,
    isLoading,
    refetch,
    seTeams: setData,
  }
}

