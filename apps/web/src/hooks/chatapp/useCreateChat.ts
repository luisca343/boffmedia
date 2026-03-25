import { useRotomRequest } from "../useRotomRequest";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";
import { CreateChatDto } from "@/types/dto/create-chat-dto";

export function useCreateChat() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(ChatAppService.createChat)

  const createChat = (chatData: CreateChatDto) => {
    return ChatAppService.createChat(chatData);
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

