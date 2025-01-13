import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { chatAppService } from '@/services/api/smartrotom/chatAppService';
import { ChatData } from '@/app/smartrotom/chatapp/_types/Chat';

export const useChatAppGetChats = (uuid: string) => {
  const { loading, error, data: chats, setData: setChats, handleRequest } = useRotomRequest<ChatData[]>();

  const getChats = useCallback(() => {
    return handleRequest(() => chatAppService.getChats(uuid));
  }, [handleRequest, uuid]);

  useEffect(() => {
    if (uuid) {
      getChats();
    }
  }, [uuid, getChats]);

  return { chats, getChats, setChats, loading, error };
};