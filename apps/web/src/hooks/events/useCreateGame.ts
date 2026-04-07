import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { CreateGameDto } from "@boffmedia/shared"

export function useCreateGame() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.createGame)

  const createGame = (game: CreateGameDto) => {
    return EventsService.createGame(game)
  }

  return {
    createdGame: data,
    error,
    isLoading,
    refetch,
    createGame,
    setCreatedGame: setData,
  }
}

