import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';

export const useChatAppGetChats = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getChats = useCallback((uuid: string) => {
    return handleRequest(() => chatAppService.getChats(uuid));
  }, [handleRequest]);

  return { getChats, loading, error };
};