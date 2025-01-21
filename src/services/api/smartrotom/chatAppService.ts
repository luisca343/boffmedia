import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { Group, RotomMessage } from '@/types/chatApp';
import { CreateChatDto } from '@/types/dto/create-chat-dto';
import { CreateChatMessageDto } from '@/types/dto/create-chat-message-dto';

export const chatAppService = {
  call: (chatId: number, uuid: string) => rotomPOST<number>(`/chatapp/call/${chatId}`, { uuid }),
  createChat: (data: CreateChatDto) => rotomPOST<number>('/chatapp/chat', data),
  getChats: (uuid: string) => rotomGET<Group[]>(`/chatapp/chats/${uuid}`),
  getMessages: (chatId: number) => rotomGET<RotomMessage[]>(`/chatapp/messages/${chatId}`),
  createMessage: (chatId: number, data: CreateChatMessageDto) => rotomPOST<RotomMessage[]>(`/chatapp/messages/${chatId}`, data)
};

