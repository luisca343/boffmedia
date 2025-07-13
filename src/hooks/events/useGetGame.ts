import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetGame(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(() => EventsService.getGame(id), [id])

  return {
    game: data,
    error,
    isLoading,
    refetch,
    setGame: setData,
  }
}

