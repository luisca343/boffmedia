import { CreateChatMessageDto } from "@/types/dto/create-chat-message-dto";
import { useRotomRequest } from "../useRotomRequest";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";
import { CreateMessageDto } from "@/generated/api";

export function useCreateMessage() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(ChatAppService.createMessage)

  const createMessage = (chatId: number, messageData: CreateMessageDto) => {
    return ChatAppService.createMessage(chatId, messageData);
  }

  return {
    createdMessage: data,
    error,
    isLoading,
    refetch,
    createMessage,
    setCreatedMessage: setData
  }
}

