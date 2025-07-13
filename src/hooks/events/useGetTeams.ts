import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"

export function useGetTeams() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.getTeams)

  return {
    teams: data,
    error,
    isLoading,
    refetch,
    seTeams: setData,
  }
}

