import { useRotomRequest } from "../useRotomRequest";
import { minaService } from "@/services/api/smartrotom/minaService";

export function useEndGame(uuid: string, rewards: { value: number, id: number }[]) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(minaService.endGame, { uuid, rewards })

  return {
    endGame: data,
    error,
    isLoading,
    refetch,
    setEndGame: setData
  }
}

