import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { ficusMessages } from '@/_db/schema/FicusAI';
import { IFicusAiRepository } from './interfaces/ficusai.interface.repository';
import { FicusMessage } from '../entities/ficus-message.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';

@Injectable()
export class FicusAIRepository
  extends BaseRepositoryImpl<FicusMessage, CreateMessageDto, never>
  implements IFicusAiRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, ficusMessages);
  }

  async create(createMessageDto: CreateMessageDto): Promise<FicusMessage> {
    const result = await this.db.insert(ficusMessages).values({
      uuid: createMessageDto.uuid,
      content: createMessageDto.content,
    });

    return this.findById(result[0].insertId) as Promise<FicusMessage>;
  }

  async update(_id: number, _updateDto: never): Promise<FicusMessage> {
    // Messages are typically immutable, but we can implement if needed
    throw new Error('Messages cannot be updated');
  }

  async delete(id: number): Promise<boolean> {
    // Hard delete: the table has no soft-delete column any more. It used to,
    // and only `countByUuid` honoured it — every read that fed the model kept
    // returning "deleted" messages, so clearing a conversation did nothing.
    const result = await this.db
      .delete(ficusMessages)
      .where(eq(ficusMessages.id, id));

    return result[0].affectedRows > 0;
  }

  async findByUuid(uuid: string, limit: number = 20): Promise<FicusMessage[]> {
    return this.db
      .select()
      .from(ficusMessages)
      .where(eq(ficusMessages.uuid, uuid))
      .orderBy(desc(ficusMessages.id))
      .limit(limit) as unknown as FicusMessage[];
  }

  async findRecentByUuid(uuid: string, limit: number): Promise<FicusMessage[]> {
    const messages = await this.db
      .select()
      .from(ficusMessages)
      .where(eq(ficusMessages.uuid, uuid))
      .orderBy(desc(ficusMessages.id))
      .limit(limit);

    // Return in chronological order (oldest first) for context
    return (messages as unknown as FicusMessage[]).reverse();
  }

  async deleteByUuid(uuid: string): Promise<boolean> {
    const result = await this.db
      .delete(ficusMessages)
      .where(eq(ficusMessages.uuid, uuid));

    return result[0].affectedRows > 0;
  }

  async countByUuid(uuid: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(ficusMessages)
      .where(eq(ficusMessages.uuid, uuid));

    return result[0]?.count || 0;
  }

  // Additional helper method for finding messages with context
  async findMessagesForContext(
    uuid: string,
    contextLimit: number = 5,
  ): Promise<FicusMessage[]> {
    return this.findRecentByUuid(uuid, contextLimit);
  }
}
