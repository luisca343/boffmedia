import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomChatAppService } from '@/services/api/rotomChatAppService';

export const useChatAppCall = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const call = useCallback((chatId: number, uuid: string) => {
    return handleRequest(() => rotomChatAppService.call(chatId, uuid));
  }, [handleRequest]);

  return { call, loading, error };
};