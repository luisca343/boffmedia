import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useEndGame(uuid: string, rewards: { value: number, id: number }[]) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.endGame, { uuid, rewards })

  return {
    endGame: data,
    error,
    isLoading,
    refetch,
    setEndGame: setData
  }
}

