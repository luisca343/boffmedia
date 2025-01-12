import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomChatAppService } from '@/services/api/rotomChatAppService';

export const useChatAppGetChats = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getChats = useCallback((uuid: string) => {
    return handleRequest(() => rotomChatAppService.getChats(uuid));
  }, [handleRequest]);

  return { getChats, loading, error };
};