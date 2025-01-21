import { useRotomRequest } from "../useRotomRequest";
import { chatAppService } from "@/services/api/smartrotom/chatAppService";

export function useGetChats(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(chatAppService.getChats, uuid)

  return {
    chats: data,
    error,
    isLoading,
    refetch,
    setChats: setData
  }
}

