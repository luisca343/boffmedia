import { ChatMember } from '../chatapp.repository';

export interface IMemberRepository {
  findChatMembers(chatId: number): Promise<ChatMember[]>;
  addChatMember(chatId: number, uuid: string): Promise<{ insertId: number }>;
  removeChatMember(chatId: number, uuid: string): Promise<void>;
  findUserInChat(chatId: number, uuid: string): Promise<ChatMember | null>;
}
