import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetGames() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.getGames)

  return {
    games: data || [],
    error,
    isLoading,
    refetch,
    setGames: setData,
  }
}

