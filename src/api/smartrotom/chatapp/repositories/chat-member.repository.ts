import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomChatUsers, RotomChatUser } from '@/_db/schema/SmartRotomChat';
import { IMemberRepository } from './interfaces/chat-member.repository.interface';
import { and, eq } from 'drizzle-orm';
import { ChatMember } from '../entities/chat.entity';

@Injectable()
export class ChatMemberRepository implements IMemberRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

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
}
