import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  RotomChat,
  rotomChats,
  rotomChatMembers,
} from '@/_db/schema/SmartRotomChat';
import { IChatRepository } from './interfaces/chat.repository.interface';
import { eq } from 'drizzle-orm';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}
  async findUserChats(uuid: string): Promise<RotomChat[]> {
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
      );
  }

  async findChatById(chatId: number): Promise<RotomChat | null> {
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

    return result[0] || null;
  }

  async findChatByName(name: string): Promise<RotomChat | null> {
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

    return result[0] || null;
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
}
