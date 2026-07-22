import { rotomGET, rotomPOST, rotomPUT } from '@/services/boffAPI';
import type {
  CreateChatDto,
  CreateMessageDto,
  UpdateMessageDto,
  DeleteMessageDto,
  MarkMessageReadDto,
  MarkChatReadDto,
  AddMemberDto,
  RemoveMemberDto,
  InitiateCallDto,
  EndCallDto,
  ReactMessageDto,
  SetChatPinnedDto,
  SetChatMutedDto,
  Chat,
  RotomMessage,
  CreateChatResponse,
  CreateMessageResponse,
  MessageResponse,
  MarkChatReadResponse,
  CallResponse
} from '@boffmedia/shared';

export class ChatAppService {
  /**
   * Create a new chat
   */
  static createChat(data: CreateChatDto) {
    return rotomPOST<CreateChatResponse>('/chatapp/chat', data);
  }

  /**
   * Get all chats for a user
   */
  static getChats(uuid: string) {
    return rotomGET<Chat[]>(`/chatapp/chats/${uuid}`);
  }

  /**
   * Get a specific chat by ID
   */
  static getChatById(chatId: number, uuid: string) {
    return rotomGET<Chat>(`/chatapp/chat/${chatId}?uuid=${uuid}`);
  }

  /**
   * Get messages for a chat
   */
  static getMessages(chatId: number, limit?: number) {
    const url = limit ? `/chatapp/messages/${chatId}?limit=${limit}` : `/chatapp/messages/${chatId}`;
    return rotomGET<RotomMessage[]>(url);
  }

  /**
   * Create a new message in a chat
   */
  static createMessage(chatId: number, data: CreateMessageDto) {
    return rotomPOST<CreateMessageResponse>(`/chatapp/messages/${chatId}`, data);
  }

  /**
   * Update an existing message
   */
  static updateMessage(messageId: number, data: UpdateMessageDto) {
    return rotomPUT<RotomMessage>(`/chatapp/message/${messageId}`, data);
  }

  /**
   * Delete a message
   */
  static deleteMessage(messageId: number, data: DeleteMessageDto) {
    return rotomPOST<MessageResponse>(`/chatapp/message/${messageId}`, data);
  }

  /**
   * Mark a message as read
   */
  static markMessageAsRead(messageId: number, data: MarkMessageReadDto) {
    return rotomPOST<MessageResponse>(`/chatapp/message/${messageId}/read`, data);
  }

  /**
   * Mark every unread message in a chat as read, in one request
   */
  static markChatAsRead(chatId: number, data: MarkChatReadDto) {
    return rotomPOST<MarkChatReadResponse>(`/chatapp/chat/${chatId}/read`, data);
  }

  /**
   * Toggle an emoji reaction on a message
   */
  static reactToMessage(messageId: number, data: ReactMessageDto) {
    return rotomPOST<MessageResponse>(`/chatapp/message/${messageId}/react`, data);
  }

  /**
   * Pin or unpin a chat for a user
   */
  static setChatPinned(chatId: number, data: SetChatPinnedDto) {
    return rotomPOST<MessageResponse>(`/chatapp/chat/${chatId}/pin`, data);
  }

  /**
   * Mute or unmute a chat for a user
   */
  static setChatMuted(chatId: number, data: SetChatMutedDto) {
    return rotomPOST<MessageResponse>(`/chatapp/chat/${chatId}/mute`, data);
  }

  /**
   * Add a member to a group chat
   */
  static addMemberToGroup(groupId: number, data: AddMemberDto) {
    return rotomPOST<MessageResponse>(`/chatapp/group/${groupId}/member`, data);
  }

  /**
   * Remove a member from a group chat
   */
  static removeMemberFromGroup(groupId: number, uuid: string, data: RemoveMemberDto) {
    return rotomPOST<MessageResponse>(`/chatapp/group/${groupId}/member/${uuid}`, data);
  }

  /**
   * Initiate a call in a chat
   */
  static initiateCall(chatId: number, data: InitiateCallDto) {
    return rotomPOST<CallResponse>(`/chatapp/call/${chatId}`, data);
  }

  /**
   * End a call in a chat
   */
  static endCall(chatId: number, data: EndCallDto) {
    return rotomPOST<RotomMessage>(`/chatapp/call/${chatId}/end`, data);
  }
}