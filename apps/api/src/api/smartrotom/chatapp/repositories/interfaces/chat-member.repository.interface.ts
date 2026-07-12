import { ChatMember } from '../chatapp.repository';

export interface IMemberRepository {
  findChatMembers(chatId: number): Promise<ChatMember[]>;
  addChatMember(chatId: number, uuid: string): Promise<{ insertId: number }>;
  removeChatMember(chatId: number, uuid: string): Promise<void>;
  findUserInChat(chatId: number, uuid: string): Promise<ChatMember | null>;
  findMemberFlags(
    chatId: number,
    uuid: string,
  ): Promise<{ pinned: boolean; muted: boolean }>;
  setPinned(chatId: number, uuid: string, pinned: boolean): Promise<void>;
  setMuted(chatId: number, uuid: string, muted: boolean): Promise<void>;
}
