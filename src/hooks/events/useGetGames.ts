import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

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

