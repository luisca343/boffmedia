import { CreateChatMessageDto } from "@/types/dto/create-chat-message-dto";
import { useRotomRequest } from "../useRotomRequest";
import { chatAppService } from "@/services/api/smartrotom/chatAppService";
import { CreateMessageDto } from "@/generated/api";

export function useCreateMessage() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(chatAppService.createMessage)

  const createMessage = (chatId: number, messageData: CreateMessageDto) => {
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

