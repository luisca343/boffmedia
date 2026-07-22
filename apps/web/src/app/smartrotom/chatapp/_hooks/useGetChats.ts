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
  updateChats: (message: Message, activeChatId: number | null) => void,
  isLoading: boolean,
  error: any
};

function useChatAppGetChatsWithUpdate(): useChatAppGetChatsWithUpdateReturnType {
  const { data: session } = useSession() as unknown as { data: Session };
  const { setChats, chats, isLoading, refetch, error } = useGetChats(getSmartRotomUser(session).uuid);


  const updateChats = (message: Message, activeChatId: number | null) => {
    const myUuid = getSmartRotomUser(session)?.uuid;

    setChats((prev: any) => {
      if (!prev) return prev;

      return prev.map((chat: ChatData) => {
        if (chat.id !== message.chatId) return chat;

        // Check if message already exists to prevent duplicates
        const messageExists = chat.messages.some((m: Message) => m.id === message.id);
        if (messageExists) return chat;

        // Own messages and messages landing in the chat the user is already
        // looking at never count as unread — the caller marks those read server-side.
        const counts = message.uuid !== myUuid && chat.id !== activeChatId;

        // Create a new chat object with updated messages (immutable)
        return {
          ...chat,
          messages: [
            { id: message.id, chatId: message.chatId, content: message.content, createdAt: message.createdAt, uuid: message.uuid, type: message.type },
            ...chat.messages
          ],
          unread: counts ? chat.unread + 1 : chat.unread
        };
      }).sort((a: ChatData, b: ChatData) => {
        const aDate = new Date(a.messages[0]?.createdAt) || new Date();
        const bDate = new Date(b.messages[0]?.createdAt) || new Date();
        return bDate.getTime() - aDate.getTime();
      });
    });
  };

  return { session, chats, setChats, refresh: refetch, updateChats, isLoading, error };
}

export default useChatAppGetChatsWithUpdate;