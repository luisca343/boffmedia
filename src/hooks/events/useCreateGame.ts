import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import { CreateGameDto } from "@/types/dto/create-game.dto"

export function useCreateGame() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.createGame)

  const createGame = (game: CreateGameDto) => {
    return eventsService.createGame(game)
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

