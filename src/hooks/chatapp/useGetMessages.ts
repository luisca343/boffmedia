import { useRotomRequest } from "../useRotomRequest";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";

export function useGetMessages(chatId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(ChatAppService.getMessages, chatId)

  return {
    messages: data,
    error,
    isLoading,
    refetch,
    setMessages: setData
  }
}

