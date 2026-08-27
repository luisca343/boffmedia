import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, asc, desc, and, inArray, ne, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomChatMessages,
  rotomChatMessageReads,
  rotomChatMessageReactions,
  RotomChatMessage,
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

  async findChatMessagesAscending(
    chatId: number,
    limit: number = 50,
    before?: number,
  ): Promise<ChatMessage[]> {
    // Keyset pagination: load messages with id < before (or all if before is omitted),
    // in descending order for efficiency, then reverse in JS to match the ascending contract.
    // Hard limit: 100 messages per page.
    const actualLimit = Math.min(Math.max(1, limit), 100);
    let query = this.db
      .select({
        id: rotomChatMessages.id,
        content: rotomChatMessages.content,
        createdAt: rotomChatMessages.createdAt,
        uuid: rotomChatMessages.senderUUID,
        type: rotomChatMessages.type,
      })
      .from(rotomChatMessages)
      .where(
        before
          ? and(eq(rotomChatMessages.chatId, chatId), sql`${rotomChatMessages.id} < ${before}`)
          : eq(rotomChatMessages.chatId, chatId),
      )
      .orderBy(desc(rotomChatMessages.id))
      .limit(actualLimit);

    const results = await query;
    // Reverse to match ascending order (caller expects newest messages last).
    return results.reverse();
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
    const result = await this.db
      .insert(rotomChatMessageReads)
      .values({ messageId, uuid })
      .onDuplicateKeyUpdate({ set: { uuid } });
    return { insertId: result[0].insertId };
  }

  async markMessagesAsRead(messageIds: number[], uuid: string): Promise<void> {
    if (messageIds.length === 0) return;
    await this.db
      .insert(rotomChatMessageReads)
      .values(messageIds.map((messageId) => ({ messageId, uuid })))
      .onDuplicateKeyUpdate({ set: { uuid } });
  }

  /** Ids of every message in the chat the user has not read; excludes their own. */
  async findUnreadMessageIds(chatId: number, uuid: string): Promise<number[]> {
    const rows = await this.db
      .select({ id: rotomChatMessages.id })
      .from(rotomChatMessages)
      .leftJoin(
        rotomChatMessageReads,
        and(
          eq(rotomChatMessageReads.messageId, rotomChatMessages.id),
          eq(rotomChatMessageReads.uuid, uuid),
        ),
      )
      .where(
        and(
          eq(rotomChatMessages.chatId, chatId),
          ne(rotomChatMessages.senderUUID, uuid),
          isNull(rotomChatMessageReads.messageId),
        ),
      );
    return rows.map((r) => r.id);
  }

  /** Same predicate as findUnreadMessageIds, counted over the chat's full history. */
  async countUnreadMessages(chatId: number, uuid: string): Promise<number> {
    const rows = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(rotomChatMessages)
      .leftJoin(
        rotomChatMessageReads,
        and(
          eq(rotomChatMessageReads.messageId, rotomChatMessages.id),
          eq(rotomChatMessageReads.uuid, uuid),
        ),
      )
      .where(
        and(
          eq(rotomChatMessages.chatId, chatId),
          ne(rotomChatMessages.senderUUID, uuid),
          isNull(rotomChatMessageReads.messageId),
        ),
      );
    return Number(rows[0]?.total ?? 0);
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
