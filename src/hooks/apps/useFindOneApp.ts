import { useRotomRequest } from "../useRotomRequest";
import { appsService } from "@/services/api/smartrotom/appsService";

export function useGetOneApp(id: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(appsService.findOne, id)

  return {
    app: data,
    error,
    isLoading,
    refetch,
    setApp: setData
  }
}

