import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { ChatData, Message } from '../_types/Chat';
import { getSmartRotomUser } from '@/lib/utils';
import { useChatAppGetChats } from '@/hooks/chatapp/useGetChats';

type useChatAppGetChatsWithUpdateReturnType = {
  session: Session,
  chats: ChatData[] | null,
  setChats: React.Dispatch<React.SetStateAction<ChatData[] | null>>,
  refresh: () => void,
  updateChats: (message: Message, activeChat: number) => void,
  loading: boolean,
  error: any
};

function useChatAppGetChatsWithUpdate(): useChatAppGetChatsWithUpdateReturnType {
  const { data: session } = useSession() as unknown as { data: Session };
  const { getChats, setChats, chats, loading, error } = useChatAppGetChats(getSmartRotomUser(session).uuid);

  const refresh = useCallback(() => {
    getChats();
  }, [getChats]);

  const updateChats = (message: Message, activeChat: number) => {
    setChats((prev: ChatData[] | null) => {
      if (!prev) return prev;
      const chat = prev.find((chat) => chat.id == message.chatId);
      if (!chat) return prev;
      chat.messages.unshift({ id: message.id, chatId: message.chatId, content: message.content, createdAt: message.createdAt, uuid: message.uuid, type: message.type });

      chat.unread++;
      return [...prev].sort((a, b) => {
        const aDate = new Date(a.messages[0]?.createdAt) || new Date();
        const bDate = new Date(b.messages[0]?.createdAt) || new Date();

        return bDate.getTime() - aDate.getTime();
      });
    });

    if (activeChat !== message.id) return;
  };

  return { session, chats, setChats, refresh, updateChats, loading, error };
}

export default useChatAppGetChatsWithUpdate;