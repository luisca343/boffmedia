import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useGetHistory(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.getPlayerHistory, uuid)

  return {
    history: data,
    error,
    isLoading,
    refetch,
    setHistory: setData
  }
}

