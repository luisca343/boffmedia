import { useCallback } from 'react';
import { CreateChatMessageDto } from '@/types/dto/create-chat-message-dto';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';

export const useChatAppCreateMessage = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const createMessage = useCallback((chatId: number, data: CreateChatMessageDto) => {
    return handleRequest(() => chatAppService.createMessage(chatId, data));
  }, [handleRequest]);

  return { createMessage, loading, error };
};