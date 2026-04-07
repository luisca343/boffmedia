import { useRotomRequest } from "../useRotomRequest";
import { LigaService } from "@/services/api/smartrotom/ligaService";

export function useGetReplay(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(LigaService.getReplay, id)

  return {
    replay: data,
    error,
    isLoading,
    refetch,
    setReplay: setData
  }
}
