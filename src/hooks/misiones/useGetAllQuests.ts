import { useRotomRequest } from "../useRotomRequest";
import { MisionesService } from "@/services/api/smartrotom/misionesService";

export function useGetAllQuests(force: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MisionesService.getAllQuests, force)

  return {
    quests: data,
    error,
    isLoading,
    refetch,
    setQuests: setData
  }
}

