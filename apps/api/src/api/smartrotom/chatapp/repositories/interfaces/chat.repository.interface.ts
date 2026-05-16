import { RotomChat } from '@/_db/schema/SmartRotomChat';

export interface IChatRepository {
  findUserChats(uuid: string): Promise<RotomChat[]>;
  findChatById(chatId: number): Promise<RotomChat | null>;
  findChatByName(name: string): Promise<RotomChat | null>;
  createChat(chatData: {
    type: number;
    name: string;
    description: string;
    image?: string;
  }): Promise<{ insertId: number }>;
  updateChat(chatId: number, chatData: Partial<RotomChat>): Promise<void>;
  deleteChat(chatId: number): Promise<void>;
}
