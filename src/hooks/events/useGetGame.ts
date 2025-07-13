import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"

export function useGetGame(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(() => eventsService.getGame(id), [id])

  return {
    game: data,
    error,
    isLoading,
    refetch,
    setGame: setData,
  }
}

