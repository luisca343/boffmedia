import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, asc, desc, and, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomChatMessages,
  rotomChatMessageReads,
  rotomChatMessageReactions,
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

  async findMessageChatId(messageId: number): Promise<number | null> {
    const rows = await this.db
      .select({ chatId: rotomChatMessages.chatId })
      .from(rotomChatMessages)
      .where(eq(rotomChatMessages.id, messageId))
      .limit(1);
    return rows[0]?.chatId ?? null;
  }

  async hasRead(messageId: number, uuid: string): Promise<boolean> {
    const rows = await this.db
      .select({ uuid: rotomChatMessageReads.uuid })
      .from(rotomChatMessageReads)
      .where(
        and(
          eq(rotomChatMessageReads.messageId, messageId),
          eq(rotomChatMessageReads.uuid, uuid),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async findReadsForMessages(
    messageIds: number[],
  ): Promise<{ messageId: number; uuid: string }[]> {
    if (messageIds.length === 0) return [];
    return this.db
      .select({
        messageId: rotomChatMessageReads.messageId,
        uuid: rotomChatMessageReads.uuid,
      })
      .from(rotomChatMessageReads)
      .where(inArray(rotomChatMessageReads.messageId, messageIds));
  }

  async findReactionsForMessages(
    messageIds: number[],
  ): Promise<{ messageId: number; uuid: string; emoji: string }[]> {
    if (messageIds.length === 0) return [];
    return this.db
      .select({
        messageId: rotomChatMessageReactions.messageId,
        uuid: rotomChatMessageReactions.uuid,
        emoji: rotomChatMessageReactions.emoji,
      })
      .from(rotomChatMessageReactions)
      .where(inArray(rotomChatMessageReactions.messageId, messageIds));
  }

  async hasReaction(
    messageId: number,
    uuid: string,
    emoji: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ emoji: rotomChatMessageReactions.emoji })
      .from(rotomChatMessageReactions)
      .where(
        and(
          eq(rotomChatMessageReactions.messageId, messageId),
          eq(rotomChatMessageReactions.uuid, uuid),
          eq(rotomChatMessageReactions.emoji, emoji),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async addReaction(
    messageId: number,
    uuid: string,
    emoji: string,
  ): Promise<void> {
    await this.db
      .insert(rotomChatMessageReactions)
      .values({ messageId, uuid, emoji });
  }

  async removeReaction(
    messageId: number,
    uuid: string,
    emoji: string,
  ): Promise<void> {
    await this.db
      .delete(rotomChatMessageReactions)
      .where(
        and(
          eq(rotomChatMessageReactions.messageId, messageId),
          eq(rotomChatMessageReactions.uuid, uuid),
          eq(rotomChatMessageReactions.emoji, emoji),
        ),
      );
  }
}
