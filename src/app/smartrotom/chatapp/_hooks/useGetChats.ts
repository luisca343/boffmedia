import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { ChatData, Message } from '../_types/Chat';
import { getSmartRotomUser } from '@/lib/utils';
import { useChatAppGetChats } from '@/hooks/chatapp/useGetChats';

type useChatAppGetChatsWithUpdateReturnType = {
  session: Session,
  chats: ChatData[],
  setChats: React.Dispatch<React.SetStateAction<ChatData[]>>,
  refresh: () => void,
  updateChats: (message: Message, activeChat: number) => void,
  loading: boolean,
    error: any
};

function useChatAppGetChatsWithUpdate(): useChatAppGetChatsWithUpdateReturnType {
  const { data: session } = useSession() as unknown as { data: Session };
  const [chats, setChats] = useState<ChatData[]>([]);
  const { getChats, loading, error } = useChatAppGetChats();

  const fetchChats = useCallback(async () => {
    if (!session) return;
    try {
      const res = await getChats(getSmartRotomUser(session).uuid);
      if (res) {
        setChats(res);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  }, [session, getChats]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const updateChats = (message: Message, activeChat: number) => {
    setChats((prev: ChatData[]) => {
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

  return { session, chats, setChats, refresh: fetchChats, updateChats, loading, error };
}

export default useChatAppGetChatsWithUpdate;