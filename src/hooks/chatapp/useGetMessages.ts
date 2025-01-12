import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';

export const useChatAppGetMessages = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getMessages = useCallback((chatId: number) => {
    return handleRequest(() => chatAppService.getMessages(chatId));
  }, [handleRequest]);

  return { getMessages, loading, error };
};