import { useRotomRequest } from "../useRotomRequest";
import { MisionesService } from "@/services/api/smartrotom/misionesService";

export function useGetQuestsForUser(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MisionesService.getQuestsForUser, uuid)

  return {
    userQuests: data,
    error,
    isLoading,
    refetch,
    setUserQuests: setData
  }
}

