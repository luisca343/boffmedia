import { useRotomRequest } from "../useRotomRequest";
import { misionesService } from "@/services/api/smartrotom/misionesService";

export function useGetAllQuests(force: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(misionesService.getAllQuests, force)

  return {
    quests: data,
    error,
    isLoading,
    refetch,
    setQuests: setData
  }
}

