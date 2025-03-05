import { useRotomRequest } from "../useRotomRequest";
import { chatAppService } from "@/services/api/smartrotom/chatAppService";
import { CreateChatMessageDto } from "@/types/dto/create-chat-message-dto";

export function useCreateMessage() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(chatAppService.createMessage)

  const createMessage = (chatId: number, messageData: CreateChatMessageDto) => {
    return chatAppService.createMessage(chatId, messageData);
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

