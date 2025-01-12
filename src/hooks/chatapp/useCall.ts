import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';

export const useChatAppCall = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const call = useCallback((chatId: number, uuid: string) => {
    return handleRequest(() => chatAppService.call(chatId, uuid));
  }, [handleRequest]);

  return { call, loading, error };
};