import { useRotomRequest } from "../useRotomRequest";
import { arcadeService } from "@/services/api/smartrotom/arcadeService";

export function useGetArcadeInfo() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(arcadeService.getInfo)

  return {
    arcadeInfo: data,
    error,
    isLoading,
    refetch,
    setArcadeInfo: setData
  }
}

