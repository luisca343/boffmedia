import { useRotomRequest } from "../useRotomRequest";
import { arcadeService } from "@/services/api/smartrotom/arcadeService";

export function useGetWordle(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(arcadeService.getWordle, uuid)

  return {
    wordleData: data,
    error,
    isLoading,
    refetch,
    setWordleData: setData
  }
}

