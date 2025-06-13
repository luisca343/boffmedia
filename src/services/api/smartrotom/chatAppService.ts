import { rotomGET, rotomPOST, rotomPUT, rotomDELETE } from '@/services/boffAPI';
import type {
  CreateChatDto,
  CreateMessageDto,
  UpdateMessageDto,
  DeleteMessageDto,
  MarkMessageReadDto,
  AddMemberDto,
  RemoveMemberDto,
  InitiateCallDto,
  EndCallDto,
  Chat,
  RotomMessage,
  CallSession,
  CreateChatResponse,
  CreateMessageResponse,
  MessageResponse,
  CallResponse
} from '@/generated/api';

export const chatAppService = {
  // Chat operations
  createChat: (data: CreateChatDto) => rotomPOST<CreateChatResponse>('/chatapp/chat', data),
  getChats: (uuid: string) => rotomGET<Chat[]>(`/chatapp/chats/${uuid}`),
  getChatById: (chatId: number, uuid: string) => rotomGET<Chat>(`/chatapp/chat/${chatId}?uuid=${uuid}`),

  // Message operations
  getMessages: (chatId: number, limit?: number) => {
    const url = limit ? `/chatapp/messages/${chatId}?limit=${limit}` : `/chatapp/messages/${chatId}`;
    return rotomGET<RotomMessage[]>(url);
  },
  createMessage: (chatId: number, data: CreateMessageDto) => rotomPOST<CreateMessageResponse>(`/chatapp/messages/${chatId}`, data),
  updateMessage: (messageId: number, data: UpdateMessageDto) => 
    rotomPUT<RotomMessage>(`/chatapp/message/${messageId}`, data),
  deleteMessage: (messageId: number, data: DeleteMessageDto) => 
    rotomDELETE<MessageResponse>(`/chatapp/message/${messageId}`, data),
  markMessageAsRead: (messageId: number, data: MarkMessageReadDto) => 
    rotomPOST<MessageResponse>(`/chatapp/message/${messageId}/read`, data),

  // Group operations
  addMemberToGroup: (groupId: number, data: AddMemberDto) => 
    rotomPOST<MessageResponse>(`/chatapp/group/${groupId}/member`, data),
  removeMemberFromGroup: (groupId: number, uuid: string, data: RemoveMemberDto) => 
    rotomDELETE<MessageResponse>(`/chatapp/group/${groupId}/member/${uuid}`, data),

  // Call operations
  initiateCall: (chatId: number, data: InitiateCallDto) => 
    rotomPOST<CallResponse>(`/chatapp/call/${chatId}`, data),
  endCall: (chatId: number, data: EndCallDto) => 
    rotomPOST<RotomMessage>(`/chatapp/call/${chatId}/end`, data),
};