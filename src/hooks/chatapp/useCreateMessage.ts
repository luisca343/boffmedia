import { useCallback } from 'react';
import { CreateChatMessageDto } from '@/types/dto/create-chat-message-dto';
import { useRotomRequest } from '../useRotomRequest';
import { rotomChatAppService } from '@/services/api/rotomChatAppService';

export const useChatAppCreateMessage = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const createMessage = useCallback((chatId: number, data: CreateChatMessageDto) => {
    return handleRequest(() => rotomChatAppService.createMessage(chatId, data));
  }, [handleRequest]);

  return { createMessage, loading, error };
};