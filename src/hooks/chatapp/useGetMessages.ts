import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';
import { Message } from '@/app/smartrotom/chatapp/_types/Chat';

export const useChatAppGetMessages = (chatId: number) => {
  const { loading, error, data: messages, handleRequest } = useRotomRequest<Message[]>();

  const getMessages = useCallback(() => {
    return handleRequest(() => chatAppService.getMessages(chatId));
  }, [handleRequest, chatId]);

  useEffect(() => {
    if (chatId) {
      getMessages();
    }
  }, [chatId, getMessages]);

  return { messages, getMessages, loading, error };
};