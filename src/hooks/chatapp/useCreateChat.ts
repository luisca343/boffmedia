import { useRotomRequest } from "../useRotomRequest";
import { chatAppService } from "@/services/api/smartrotom/chatAppService";
import { CreateChatDto } from "@/types/dto/create-chat-dto";

export function useCreateChat() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(chatAppService.createChat)

  const createChat = (chatData: CreateChatDto) => {
    return chatAppService.createChat(chatData);
  }

  return {
    createdChat: data,
    error,
    isLoading,
    refetch,
    createChat,
    setCreatedChat: setData
  }
}

