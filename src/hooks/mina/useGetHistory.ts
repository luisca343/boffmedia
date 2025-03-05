import { useRotomRequest } from "../useRotomRequest";
import { minaService } from "@/services/api/smartrotom/minaService";

export function useGetHistory(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(minaService.getHistory, uuid)

  return {
    history: data,
    error,
    isLoading,
    refetch,
    setHistory: setData
  }
}

