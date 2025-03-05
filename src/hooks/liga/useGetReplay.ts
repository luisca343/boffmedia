import { useRotomRequest } from "../useRotomRequest";
import { ligaService } from "@/services/api/smartrotom/ligaService";

export function useGetReplay(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(ligaService.getReplay, id)

  return {
    replay: data,
    error,
    isLoading,
    refetch,
    setReplay: setData
  }
}
