import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { ChatData, Message } from '../_types/Chat';
import { getSmartRotomUser } from '@/lib/utils';
import { useGetChats } from '@/hooks/chatapp/useGetChats';

type useChatAppGetChatsWithUpdateReturnType = {
  session: Session,
  chats: any | null,
  setChats: React.Dispatch<React.SetStateAction<any | null>>,
  refresh: () => void,
  updateChats: (message: Message, activeChat: number) => void,
  isLoading: boolean,
  error: any
};

function useChatAppGetChatsWithUpdate(): useChatAppGetChatsWithUpdateReturnType {
  const { data: session } = useSession() as unknown as { data: Session };
  const { setChats, chats, isLoading, refetch, error } = useGetChats(getSmartRotomUser(session).uuid);


  const updateChats = (message: Message, activeChat: number) => {
    setChats((prev: any) => {
      if (!prev) return prev;
      const chat = prev.find((chat: ChatData) => chat.id == message.chatId); 
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

  return { session, chats, setChats, refresh: refetch, updateChats, isLoading, error };
}

export default useChatAppGetChatsWithUpdate;