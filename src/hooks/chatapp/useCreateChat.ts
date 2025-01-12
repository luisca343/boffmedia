import { useCallback } from 'react';
import { CreateChatDto } from '@/types/dto/create-chat-dto';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';

export const useChatAppCreateChat = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const createChat = useCallback((data: CreateChatDto) => {
    return handleRequest(() => chatAppService.createChat(data));
  }, [handleRequest]);

  return { createChat, loading, error };
};