import { useRotomRequest } from "../useRotomRequest";
import { misionesService } from "@/services/api/smartrotom/misionesService";

export function useGetQuestsForUser(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(misionesService.getQuestsForUser, uuid)

  return {
    userQuests: data,
    error,
    isLoading,
    refetch,
    setUserQuests: setData
  }
}

