import { getSmartRotomUser } from '@/lib/utils';
import { rotomGET } from '@/services/boffAPI';
import { useState, useEffect, useCallback } from 'react';
import { ChatData, Message } from '../_types/Chat';
import { BoffSession } from '@/types';
import { useSession } from 'next-auth/react';

type UseChatsReturnType = {
    session: BoffSession,
    chats: ChatData[],
    setChats: React.Dispatch<React.SetStateAction<ChatData[]>>,
    refresh: () => void,
    updateChats: (message: Message, activeChat: number) => void
};

function useChats(): UseChatsReturnType {
    const { data: session } = useSession();
    const [chats, setChats] = useState<ChatData[]>([]);

    const fetchChats = useCallback(async () => {
        try {
            const res = await rotomGET(`/chatapp/chats/${getSmartRotomUser(session).uuid}`);
            setChats(res);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        }
    }, [session]);

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

    return { session, chats, setChats, refresh: fetchChats, updateChats };
}

export default useChats;