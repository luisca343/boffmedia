import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"

export function useGetGames() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.getGames)

  return {
    games: data || [],
    error,
    isLoading,
    refetch,
    setGames: setData,
  }
}

