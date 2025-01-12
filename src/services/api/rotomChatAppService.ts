import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { CreateChatDto } from '@/types/dto/create-chat-dto';
import { CreateChatMessageDto } from '@/types/dto/create-chat-message-dto';

export const rotomChatAppService = {
  call: (chatId: number, uuid: string) => rotomPOST(`/chatapp/call/${chatId}`, { uuid }),
  createChat: (data: CreateChatDto) => rotomPOST('/chatapp/chat', data),
  getChats: (uuid: string) => rotomGET(`/chatapp/chats/${uuid}`),
  getMessages: (chatId: number) => rotomGET(`/chatapp/messages/${chatId}`),
  createMessage: (chatId: number, data: CreateChatMessageDto) => rotomPOST(`/chatapp/messages/${chatId}`, data)
};