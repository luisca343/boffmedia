import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, asc, desc, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  rotomChats, 
  rotomChatUsers, 
  rotomChatMessages, 
  rotomChatMessageReads,
  RotomChat,
  RotomChatUser,
  RotomChatMessage,
  RotomChatMessageRead
} from '@/_db/schema/SmartRotomChat';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';

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
      updatedAt: rotomChats.updatedAt
    };

    return this.db.selectDistinct(params)
      .from(rotomChats)
      .leftJoin(rotomChatUsers, eq(rotomChatUsers.chatId, rotomChats.id))
      .where(eq(rotomChatUsers.uuid, uuid))
      .union(
        this.db.select({ ...params })
          .from(rotomChats)
          .where(eq(rotomChats.type, 0))
      );
  }

  async findChatById(chatId: number): Promise<ChatDetails | null> {
    const result = await this.db.select({
      id: rotomChats.id,
      name: rotomChats.name,
      type: rotomChats.type,
      description: rotomChats.description,
      image: rotomChats.image,
      createdAt: rotomChats.createdAt,
      updatedAt: rotomChats.updatedAt
    })
    .from(rotomChats)
    .where(eq(rotomChats.id, chatId))
    .limit(1);

    return result[0] || null;
  }

  async findChatByName(name: string): Promise<ChatDetails | null> {
    const result = await this.db.select({
      id: rotomChats.id,
      name: rotomChats.name,
      type: rotomChats.type,
      description: rotomChats.description,
      image: rotomChats.image,
      createdAt: rotomChats.createdAt,
      updatedAt: rotomChats.updatedAt
    })
    .from(rotomChats)
    .where(eq(rotomChats.name, name))
    .limit(1);

    return result[0] || null;
  }

  async createChat(chatData: {
    type: number;
    name: string;
    description: string;
    image?: string;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChats)
      .values({
        ...chatData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as RotomChat);
    
    return { insertId: result[0].insertId };
  }

  async updateChat(chatId: number, chatData: Partial<RotomChat>): Promise<void> {
    await this.db.update(rotomChats)
      .set({
        ...chatData,
        updatedAt: new Date()
      } as RotomChat)
      .where(eq(rotomChats.id, chatId));
  }

  async deleteChat(chatId: number): Promise<void> {
    await this.db.delete(rotomChats)
      .where(eq(rotomChats.id, chatId));
  }

  // ==================== CHAT MEMBER OPERATIONS ====================

  async findChatMembers(chatId: number): Promise<ChatMember[]> {
    return this.db.select({ uuid: rotomChatUsers.uuid })
      .from(rotomChatUsers)
      .where(eq(rotomChatUsers.chatId, chatId));
  }

  async addChatMember(chatId: number, uuid: string): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChatUsers)
      .values({
        chatId,
        uuid,
        createdAt: new Date(),
        updatedAt: new Date()
      } as RotomChatUser);
    
    return { insertId: result[0].insertId };
  }

  async removeChatMember(chatId: number, uuid: string): Promise<void> {
    await this.db.delete(rotomChatUsers)
      .where(and(
        eq(rotomChatUsers.chatId, chatId),
        eq(rotomChatUsers.uuid, uuid)
      ));
  }

  async findUserInChat(chatId: number, uuid: string): Promise<ChatMember | null> {
    const result = await this.db.select({ uuid: rotomChatUsers.uuid })
      .from(rotomChatUsers)
      .where(and(
        eq(rotomChatUsers.chatId, chatId),
        eq(rotomChatUsers.uuid, uuid)
      ))
      .limit(1);

    return result[0] || null;
  }

  // ==================== MESSAGE OPERATIONS ====================

  async findChatMessages(chatId: number, limit: number = 50): Promise<ChatMessage[]> {
    return this.db.select({
      id: rotomChatMessages.id,
      content: rotomChatMessages.content,
      createdAt: rotomChatMessages.createdAt,
      uuid: rotomChatMessages.senderUUID,
      type: rotomChatMessages.type
    })
    .from(rotomChatMessages)
    .where(eq(rotomChatMessages.chatId, chatId))
    .orderBy(desc(rotomChatMessages.createdAt))
    .limit(limit);
  }

  async findChatMessagesAscending(chatId: number): Promise<ChatMessage[]> {
    return this.db.select({
      id: rotomChatMessages.id,
      content: rotomChatMessages.content,
      createdAt: rotomChatMessages.createdAt,
      uuid: rotomChatMessages.senderUUID,
      type: rotomChatMessages.type
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
    const result = await this.db.insert(rotomChatMessages)
      .values({
        ...messageData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
    
    return { insertId: result[0].insertId };
  }

  async findMessageById(messageId: number): Promise<ChatMessage | null> {
    const result = await this.db.select({
      id: rotomChatMessages.id,
      content: rotomChatMessages.content,
      createdAt: rotomChatMessages.createdAt,
      uuid: rotomChatMessages.senderUUID,
      type: rotomChatMessages.type
    })
    .from(rotomChatMessages)
    .where(eq(rotomChatMessages.id, messageId))
    .limit(1);

    return result[0] || null;
  }

  async updateMessage(messageId: number, content: string): Promise<void> {
    await this.db.update(rotomChatMessages)
      .set({
        content,
        updatedAt: new Date()
      } as Partial<RotomChatMessage>)
      .where(eq(rotomChatMessages.id, messageId));
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.db.delete(rotomChatMessages)
      .where(eq(rotomChatMessages.id, messageId));
  }

  // ==================== MESSAGE READ OPERATIONS ====================

  async markMessageAsRead(messageId: number, uuid: string): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChatMessageReads)
      .values({
        messageId,
        uuid,
        createdAt: new Date(),
        updatedAt: new Date()
      } as RotomChatMessageRead);
    
    return { insertId: result[0].insertId };
  }

  async findMessageReads(messageId: number): Promise<{ uuid: string }[]> {
    return this.db.select({ uuid: rotomChatMessageReads.uuid })
      .from(rotomChatMessageReads)
      .where(eq(rotomChatMessageReads.messageId, messageId));
  }

  // ==================== USER OPERATIONS ====================

  async findUserByUuid(uuid: string): Promise<UserProfile | null> {
    const result = await this.db.select({
      uuid: smartrotomUsers.uuid,
      username: smartrotomUsers.username
    })
    .from(smartrotomUsers)
    .where(eq(smartrotomUsers.uuid, uuid))
    .limit(1);

    return result[0] || null;
  }
}