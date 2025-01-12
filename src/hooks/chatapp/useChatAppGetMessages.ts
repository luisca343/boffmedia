import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomChatAppService } from '@/services/api/rotomChatAppService';

export const useChatAppGetMessages = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getMessages = useCallback((chatId: number) => {
    return handleRequest(() => rotomChatAppService.getMessages(chatId));
  }, [handleRequest]);

  return { getMessages, loading, error };
};