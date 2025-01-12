import { useCallback } from 'react';
import { CreateChatDto } from '@/types/dto/create-chat-dto';
import { useRotomRequest } from '../useRotomRequest';
import { rotomChatAppService } from '@/services/api/rotomChatAppService';

export const useChatAppCreateChat = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const createChat = useCallback((data: CreateChatDto) => {
    return handleRequest(() => rotomChatAppService.createChat(data));
  }, [handleRequest]);

  return { createChat, loading, error };
};