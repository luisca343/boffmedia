import { ChatMessage } from '../chatapp.repository';

export interface IMessageRepository {
  findChatMessages(chatId: number, limit?: number): Promise<ChatMessage[]>;
  findChatMessagesAscending(chatId: number): Promise<ChatMessage[]>;
  createMessage(messageData: {
    chatId: number;
    content: string;
    senderUUID: string;
    type: string;
  }): Promise<{ insertId: number }>;
  findMessageById(messageId: number): Promise<ChatMessage | null>;
  updateMessage(messageId: number, content: string): Promise<void>;
  deleteMessage(messageId: number): Promise<void>;
  markMessageAsRead(
    messageId: number,
    uuid: string,
  ): Promise<{ insertId: number }>;
  findMessageReads(messageId: number): Promise<{ uuid: string }[]>;
  findMessageChatId(messageId: number): Promise<number | null>;
  hasRead(messageId: number, uuid: string): Promise<boolean>;
  findReadsForMessages(
    messageIds: number[],
  ): Promise<{ messageId: number; uuid: string }[]>;
  findReactionsForMessages(
    messageIds: number[],
  ): Promise<{ messageId: number; uuid: string; emoji: string }[]>;
  hasReaction(
    messageId: number,
    uuid: string,
    emoji: string,
  ): Promise<boolean>;
  addReaction(messageId: number, uuid: string, emoji: string): Promise<void>;
  removeReaction(messageId: number, uuid: string, emoji: string): Promise<void>;
}
