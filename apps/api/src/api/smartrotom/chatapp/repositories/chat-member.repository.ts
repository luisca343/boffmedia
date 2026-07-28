import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomChatMembers, RotomChatMember } from '@/_db/schema/SmartRotomChat';
import { rotomUsers } from '@/_db/schema/SmartRotom';
import { IMemberRepository } from './interfaces/chat-member.repository.interface';
import { and, eq } from 'drizzle-orm';
import { ChatMember } from '../entities/chat.entity';

@Injectable()
export class ChatMemberRepository implements IMemberRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findChatMembers(chatId: number): Promise<ChatMember[]> {
    if (chatId <= 0) {
      return this.db
        .select({
          uuid: rotomChatMembers.uuid,
          username: rotomUsers.username,
        })
        .from(rotomChatMembers)
        .leftJoin(
          rotomUsers,
          eq(rotomChatMembers.uuid, rotomUsers.uuid),
        ) as unknown as Promise<ChatMember[]>;
    }

    return this.db
      .select({
        uuid: rotomChatMembers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomChatMembers)
      .leftJoin(rotomUsers, eq(rotomChatMembers.uuid, rotomUsers.uuid))
      .where(eq(rotomChatMembers.chatId, chatId)) as unknown as ChatMember[];
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
        and(eq(rotomChatMembers.chatId, chatId), eq(rotomChatMembers.uuid, uuid)),
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
        and(eq(rotomChatMembers.chatId, chatId), eq(rotomChatMembers.uuid, uuid)),
      )
      .limit(1);
    return result[0] || null;
  }

  async findMemberFlags(
    chatId: number,
    uuid: string,
  ): Promise<{ pinned: boolean; muted: boolean }> {
    const result = await this.db
      .select({ pinned: rotomChatMembers.pinned, muted: rotomChatMembers.muted })
      .from(rotomChatMembers)
      .where(
        and(eq(rotomChatMembers.chatId, chatId), eq(rotomChatMembers.uuid, uuid)),
      )
      .limit(1);
    return result[0] || { pinned: false, muted: false };
  }

  async setPinned(
    chatId: number,
    uuid: string,
    pinned: boolean,
  ): Promise<void> {
    await this.db
      .update(rotomChatMembers)
      .set({ pinned })
      .where(
        and(eq(rotomChatMembers.chatId, chatId), eq(rotomChatMembers.uuid, uuid)),
      );
  }

  async setMuted(chatId: number, uuid: string, muted: boolean): Promise<void> {
    await this.db
      .update(rotomChatMembers)
      .set({ muted })
      .where(
        and(eq(rotomChatMembers.chatId, chatId), eq(rotomChatMembers.uuid, uuid)),
      );
  }
}
