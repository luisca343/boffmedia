import { useRotomRequest } from "../useRotomRequest";
import { chatAppService } from "@/services/api/smartrotom/chatAppService";

export function useGetMessages(chatId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(chatAppService.getMessages, chatId)

  return {
    messages: data,
    error,
    isLoading,
    refetch,
    setMessages: setData
  }
}

