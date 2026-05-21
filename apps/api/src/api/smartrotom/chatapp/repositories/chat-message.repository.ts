import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, asc, desc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomChatMessages,
  rotomChatMessageReads,
  RotomChatMessage,
  RotomChatMessageRead,
} from '@/_db/schema/SmartRotomChat';
import { ChatMessage } from '../entities/chat.entity';

@Injectable()
export class ChatMessageRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findChatMessages(
    chatId: number,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    return this.db
      .select({
        id: rotomChatMessages.id,
        content: rotomChatMessages.content,
        createdAt: rotomChatMessages.createdAt,
        uuid: rotomChatMessages.senderUUID,
        type: rotomChatMessages.type,
      })
      .from(rotomChatMessages)
      .where(eq(rotomChatMessages.chatId, chatId))
      .orderBy(desc(rotomChatMessages.createdAt))
      .limit(limit);
  }

  async findChatMessagesAscending(chatId: number): Promise<ChatMessage[]> {
    return this.db
      .select({
        id: rotomChatMessages.id,
        content: rotomChatMessages.content,
        createdAt: rotomChatMessages.createdAt,
        uuid: rotomChatMessages.senderUUID,
        type: rotomChatMessages.type,
      })
      .from(rotomChatMessages)
      .where(eq(rotomChatMessages.chatId, chatId))
      .orderBy(asc(rotomChatMessages.createdAt));
  }

  async createMessage(messageData: {
    chatId: number;
    content: string;
    senderUUID: string;
    type: string;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChatMessages).values({
      ...messageData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    return { insertId: result[0].insertId };
  }

  async findMessageById(messageId: number): Promise<ChatMessage | null> {
    const result = await this.db
      .select({
        id: rotomChatMessages.id,
        content: rotomChatMessages.content,
        createdAt: rotomChatMessages.createdAt,
        uuid: rotomChatMessages.senderUUID,
        type: rotomChatMessages.type,
      })
      .from(rotomChatMessages)
      .where(eq(rotomChatMessages.id, messageId))
      .limit(1);
    return result[0] || null;
  }

  async updateMessage(messageId: number, content: string): Promise<void> {
    await this.db
      .update(rotomChatMessages)
      .set({
        content,
        updatedAt: new Date(),
      } as Partial<RotomChatMessage>)
      .where(eq(rotomChatMessages.id, messageId));
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.db
      .delete(rotomChatMessages)
      .where(eq(rotomChatMessages.id, messageId));
  }

  async markMessageAsRead(
    messageId: number,
    uuid: string,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChatMessageReads).values({
      messageId,
      uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RotomChatMessageRead);
    return { insertId: result[0].insertId };
  }

  async findMessageReads(messageId: number): Promise<{ uuid: string }[]> {
    return this.db
      .select({ uuid: rotomChatMessageReads.uuid })
      .from(rotomChatMessageReads)
      .where(eq(rotomChatMessageReads.messageId, messageId));
  }
}
