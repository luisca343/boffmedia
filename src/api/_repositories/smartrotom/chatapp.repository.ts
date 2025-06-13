import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  rotomChats, 
  rotomChatUsers,
  rotomChatMessages,
  RotomChat,
  RotomChatUser,
  RotomChatMessage
} from '@/_db/schema/SmartRotomChat';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import {
  ChatDetails,
  ChatMessage,
  ChatMember,
  BaseUserProfile,
  ChatCreationData,
  MessageCreationData
} from '@api/smartrotom/chatapp/types/chatapp.types';

@Injectable()
export class ChatappRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== CHAT OPERATIONS ====================

  async createChat(chatData: ChatCreationData): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChats)
      .values({
        type: chatData.type,
        name: chatData.name,
        description: chatData.description,
        image: chatData.image || null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as RotomChat);
    
    return { insertId: result[0].insertId };
  }

  async findChatById(chatId: number): Promise<ChatDetails | null> {
    const result = await this.db.select({
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

    return result[0] || null;
  }

  async updateChat(chatId: number, chatData: Partial<ChatCreationData>): Promise<void> {
    await this.db.update(rotomChats)
      .set({
        ...chatData,
        updatedAt: new Date()
      } as Partial<RotomChat>)
      .where(eq(rotomChats.id, chatId));
  }

  async deleteChat(chatId: number): Promise<void> {
    await this.db.delete(rotomChats)
      .where(eq(rotomChats.id, chatId));
  }

  // ==================== CHAT USER OPERATIONS ====================

  async addUserToChat(chatId: number, uuid: string): Promise<void> {
    await this.db.insert(rotomChatUsers)
      .values({
        chatId,
        uuid
      } as RotomChatUser);
  }

  async removeUserFromChat(chatId: number, uuid: string): Promise<void> {
    await this.db.delete(rotomChatUsers)
      .where(and(
        eq(rotomChatUsers.chatId, chatId),
        eq(rotomChatUsers.uuid, uuid)
      ));
  }

  async findChatMembers(chatId: number): Promise<ChatMember[]> {
    const result = await this.db.select({
      uuid: rotomChatUsers.uuid
    })
    .from(rotomChatUsers)
    .where(eq(rotomChatUsers.chatId, chatId));

    return result;
  }

  async findUserChats(uuid: string): Promise<ChatDetails[]> {
    const result = await this.db.select({
      id: rotomChats.id,
      name: rotomChats.name,
      type: rotomChats.type,
      description: rotomChats.description,
      image: rotomChats.image,
      createdAt: rotomChats.createdAt,
      updatedAt: rotomChats.updatedAt,
    })
    .from(rotomChats)
    .leftJoin(rotomChatUsers, eq(rotomChatUsers.chatId, rotomChats.id))
    .where(eq(rotomChatUsers.uuid, uuid))
    .orderBy(desc(rotomChats.updatedAt));

    return result;
  }

  async isUserInChat(chatId: number, uuid: string): Promise<boolean> {
    const result = await this.db.select()
      .from(rotomChatUsers)
      .where(and(
        eq(rotomChatUsers.chatId, chatId),
        eq(rotomChatUsers.uuid, uuid)
      ))
      .limit(1);

    return result.length > 0;
  }

  // ==================== MESSAGE OPERATIONS ====================

  async createMessage(messageData: MessageCreationData): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomChatMessages)
      .values({
        chatId: messageData.chatId,
        senderUUID: messageData.senderUUID,
        content: messageData.content,
        type: messageData.type,
        createdAt: new Date()
      } as RotomChatMessage);
    
    return { insertId: result[0].insertId };
  }

  async findMessageById(messageId: number): Promise<ChatMessage | null> {
    const result = await this.db.select({
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

  async findChatMessages(chatId: number, limit?: number): Promise<ChatMessage[]> {
    const query = this.db.select({
      id: rotomChatMessages.id,
      content: rotomChatMessages.content,
      createdAt: rotomChatMessages.createdAt,
      uuid: rotomChatMessages.senderUUID,
      type: rotomChatMessages.type,
    })
    .from(rotomChatMessages)
    .where(eq(rotomChatMessages.chatId, chatId))
    .orderBy(desc(rotomChatMessages.createdAt));

    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  async getLastChatMessage(chatId: number): Promise<ChatMessage | null> {
    const result = await this.db.select({
      id: rotomChatMessages.id,
      content: rotomChatMessages.content,
      createdAt: rotomChatMessages.createdAt,
      uuid: rotomChatMessages.senderUUID,
      type: rotomChatMessages.type,
    })
    .from(rotomChatMessages)
    .where(eq(rotomChatMessages.chatId, chatId))
    .orderBy(desc(rotomChatMessages.createdAt))
    .limit(1);

    return result[0] || null;
  }

  async updateMessage(messageId: number, content: string): Promise<void> {
    await this.db.update(rotomChatMessages)
      .set({ content })
      .where(eq(rotomChatMessages.id, messageId));
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.db.delete(rotomChatMessages)
      .where(eq(rotomChatMessages.id, messageId));
  }

  async getUnreadMessageCount(chatId: number, uuid: string): Promise<number> {
    // This would require a message read tracking table
    // For now, return 0 as placeholder
    return 0;
  }

  // ==================== USER OPERATIONS ====================

  async findUserProfile(uuid: string): Promise<BaseUserProfile | null> {
    const result = await this.db.select({
      uuid: smartrotomUsers.uuid,
      username: smartrotomUsers.username
    })
    .from(smartrotomUsers)
    .where(eq(smartrotomUsers.uuid, uuid))
    .limit(1);

    return result[0] || null;
  }

  async findUserProfiles(uuids: string[]): Promise<BaseUserProfile[]> {
    if (uuids.length === 0) return [];

    const result = await this.db.select({
      uuid: smartrotomUsers.uuid,
      username: smartrotomUsers.username
    })
    .from(smartrotomUsers)
    .where(sql`${smartrotomUsers.uuid} IN (${uuids.map(uuid => `'${uuid}'`).join(',')})`);

    return result;
  }

  // ==================== VALIDATION OPERATIONS ====================

  async chatExists(chatId: number): Promise<boolean> {
    const result = await this.db.select()
      .from(rotomChats)
      .where(eq(rotomChats.id, chatId))
      .limit(1);

    return result.length > 0;
  }

  async messageExists(messageId: number): Promise<boolean> {
    const result = await this.db.select()
      .from(rotomChatMessages)
      .where(eq(rotomChatMessages.id, messageId))
      .limit(1);

    return result.length > 0;
  }

  async isMessageOwner(messageId: number, uuid: string): Promise<boolean> {
    const result = await this.db.select()
      .from(rotomChatMessages)
      .where(and(
        eq(rotomChatMessages.id, messageId),
        eq(rotomChatMessages.senderUUID, uuid)
      ))
      .limit(1);

    return result.length > 0;
  }
}