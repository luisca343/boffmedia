import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, asc, desc, and, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomChats,
  rotomChatMembers,
  rotomChatMessages,
  rotomChatMessageReads,
  RotomChat,
  RotomChatMessage,
  RotomChatMessageRead,
} from '@/_db/schema/SmartRotomChat';
import { rotomUsers } from '@/_db/schema/SmartRotom';

export interface ChatDetails {
  id: number;
  name: string;
  type: number;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  content: string;
  createdAt: Date;
  uuid: string;
  type: string;
}

export interface ChatMember {
  uuid: string;
  username?: string;
}

export interface UserProfile {
  uuid: string;
  username: string;
}

@Injectable()
export class ChatappRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== CHAT OPERATIONS ====================

  async findUserChats(uuid: string): Promise<ChatDetails[]> {
    const params = {
      id: rotomChats.id,
      name: rotomChats.name,
      type: rotomChats.type,
      description: rotomChats.description,
      image: rotomChats.image,
      createdAt: rotomChats.createdAt,
      updatedAt: rotomChats.updatedAt,
    };

    return this.db
      .selectDistinct(params)
      .from(rotomChats)
      .leftJoin(rotomChatMembers, eq(rotomChatMembers.chatId, rotomChats.id))
      .where(eq(rotomChatMembers.uuid, uuid))
      .union(
        this.db
          .select({ ...params })
          .from(rotomChats)
          .where(eq(rotomChats.type, 0)),
      ) as unknown as ChatDetails[];
  }

  async findChatById(chatId: number): Promise<ChatDetails | null> {
    const result = await this.db
      .select({
        id: rotomChats.id,
        name: rotomChats.name,
        type: rotomChats.type,
        description: rotomChats.description,
        image: rotomChats.image,
        createdAt: rotomChats.createdAt,
        updatedAt: rotomChats.updatedAt,
      })
      .from(rotomChats)
      .where(eq(rotomChats.id, chatId))
      .limit(1);

    return (result[0] || null) as unknown as ChatDetails | null;
  }

  async findChatByName(name: string): Promise<ChatDetails | null> {
    const result = await this.db
      .select({
        id: rotomChats.id,
        name: rotomChats.name,
        type: rotomChats.type,
        description: rotomChats.description,
        image: rotomChats.image,
        createdAt: rotomChats.createdAt,
        updatedAt: rotomChats.updatedAt,
      })
      .from(rotomChats)
      .where(eq(rotomChats.name, name))
      .limit(1);

    return (result[0] || null) as unknown as ChatDetails | null;
  }

  async createChat(chatData: {
    type: number;
    name: string;
    description: string;
    image?: string;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChats).values({
      ...chatData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RotomChat);

    return { insertId: result[0].insertId };
  }

  async updateChat(
    chatId: number,
    chatData: Partial<RotomChat>,
  ): Promise<void> {
    await this.db
      .update(rotomChats)
      .set({
        ...chatData,
        updatedAt: new Date(),
      } as RotomChat)
      .where(eq(rotomChats.id, chatId));
  }

  async deleteChat(chatId: number): Promise<void> {
    await this.db.delete(rotomChats).where(eq(rotomChats.id, chatId));
  }

  // ==================== CHAT MEMBER OPERATIONS ====================

  async findChatMembers(chatId: number): Promise<ChatMember[]> {
    return this.db
      .select({ uuid: rotomChatMembers.uuid })
      .from(rotomChatMembers)
      .where(eq(rotomChatMembers.chatId, chatId));
  }

  async addChatMember(
    chatId: number,
    uuid: string,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChatMembers).values({
      chatId,
      uuid,
    });

    return { insertId: result[0].insertId };
  }

  async removeChatMember(chatId: number, uuid: string): Promise<void> {
    await this.db
      .delete(rotomChatMembers)
      .where(
        and(
          eq(rotomChatMembers.chatId, chatId),
          eq(rotomChatMembers.uuid, uuid),
        ),
      );
  }

  async findUserInChat(
    chatId: number,
    uuid: string,
  ): Promise<ChatMember | null> {
    const result = await this.db
      .select({ uuid: rotomChatMembers.uuid })
      .from(rotomChatMembers)
      .where(
        and(
          eq(rotomChatMembers.chatId, chatId),
          eq(rotomChatMembers.uuid, uuid),
        ),
      )
      .limit(1);

    return result[0] || null;
  }

  // ==================== MESSAGE OPERATIONS ====================

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
      .limit(limit) as unknown as ChatMessage[];
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
    return (results.reverse() as unknown as ChatMessage[]);
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
    } as unknown as RotomChatMessage);

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

    return (result[0] || null) as unknown as ChatMessage | null;
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

  // ==================== MESSAGE READ OPERATIONS ====================

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

  // ==================== USER OPERATIONS ====================

  async findUserByUuid(uuid: string): Promise<UserProfile | null> {
    const result = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid))
      .limit(1);

    return result[0] || null;
  }
}
