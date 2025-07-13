import { useRotomRequest } from "../useRotomRequest";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";

export function useGetChats(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(ChatAppService.getChats, uuid)

  return {
    chats: data,
    error,
    isLoading,
    refetch,
    setChats: setData
  }
}

