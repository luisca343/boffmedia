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
  /**
   * Create a new chat
   */
  createChat: (data: CreateChatDto) => rotomPOST<CreateChatResponse>('/chatapp/chat', data),

  /**
   * Get all chats for a user
   */
  getChats: (uuid: string) => rotomGET<Chat[]>(`/chatapp/chats/${uuid}`),

  /**
   * Get a specific chat by ID
   */
  getChatById: (chatId: number, uuid: string) => rotomGET<Chat>(`/chatapp/chat/${chatId}?uuid=${uuid}`),

  /**
   * Get messages for a chat
   */
  getMessages: (chatId: number, limit?: number) => {
    const url = limit ? `/chatapp/messages/${chatId}?limit=${limit}` : `/chatapp/messages/${chatId}`;
    return rotomGET<RotomMessage[]>(url);
  },

  /**
   * Create a new message in a chat
   */
  createMessage: (chatId: number, data: CreateMessageDto) => rotomPOST<CreateMessageResponse>(`/chatapp/messages/${chatId}`, data),

  /**
   * Update an existing message
   */
  updateMessage: (messageId: number, data: UpdateMessageDto) => 
    rotomPUT<RotomMessage>(`/chatapp/message/${messageId}`, data),

  /**
   * Delete a message
   */
  deleteMessage: (messageId: number, data: DeleteMessageDto) => 
    rotomPOST<MessageResponse>(`/chatapp/message/${messageId}`, data),

  /**
   * Mark a message as read
   */
  markMessageAsRead: (messageId: number, data: MarkMessageReadDto) => 
    rotomPOST<MessageResponse>(`/chatapp/message/${messageId}/read`, data),

  /**
   * Add a member to a group chat
   */
  addMemberToGroup: (groupId: number, data: AddMemberDto) => 
    rotomPOST<MessageResponse>(`/chatapp/group/${groupId}/member`, data),

  /**
   * Remove a member from a group chat
   */
  removeMemberFromGroup: (groupId: number, uuid: string, data: RemoveMemberDto) => 
    rotomPOST<MessageResponse>(`/chatapp/group/${groupId}/member/${uuid}`, data),

  /**
   * Initiate a call in a chat
   */
  initiateCall: (chatId: number, data: InitiateCallDto) => 
    rotomPOST<CallResponse>(`/chatapp/call/${chatId}`, data),

  /**
   * End a call in a chat
   */
  endCall: (chatId: number, data: EndCallDto) => 
    rotomPOST<RotomMessage>(`/chatapp/call/${chatId}/end`, data),
};