import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IReplaysRepository } from './interfaces/achievements.replays.repository.interface';
import { CreateReplayFullDto } from '../dto/create-replay-full.dto';
import { UpdateReplayDto } from '../dto/update-replay.dto';
import { Replay } from '../entities/replay.entity';
import {
  SmartRotomReplay,
  SmartRotomUserReplay,
  smartRotomReplays,
  smartRotomUserReplays,
} from '@/_db/schema/SmartRotom';
import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';

@Injectable()
export class ReplaysRepository
  extends BaseRepositoryImpl<Replay, CreateReplayFullDto, UpdateReplayDto>
  implements IReplaysRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, smartRotomReplays);
  }

  async create(data: CreateReplayFullDto): Promise<Replay> {
    const result = await this.db
      .insert(smartRotomReplays)
      .values(data as SmartRotomReplay);
    return this.findById(result[0].insertId) as Promise<Replay>;
  }

  async update(id: number, data: UpdateReplayDto): Promise<Replay> {
    await this.db
      .update(smartRotomReplays)
      .set(data)
      .where(eq(smartRotomReplays.id, id));
    return this.findById(id) as Promise<Replay>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(smartRotomReplays)
      .where(eq(smartRotomReplays.id, id));
    return result[0].affectedRows > 0;
  }

  async createUserReplay(userReplayData: any): Promise<BaseInsertResponse> {
    const result = await this.db
      .insert(smartRotomUserReplays)
      .values(userReplayData as SmartRotomUserReplay);

    return { insertId: result[0].insertId };
  }

  async findUserReplay(uuid: string, replayId: number): Promise<any | null> {
    const result = await this.db
      .select({
        id: smartRotomReplays.id,
        team1: smartRotomReplays.team1,
        team2: smartRotomReplays.team2,
        replay: smartRotomReplays.replay,
        winner: smartRotomReplays.winner,
        side1: smartRotomReplays.side1,
        side2: smartRotomReplays.side2,
        date: smartRotomReplays.createdAt,
      })
      .from(smartRotomReplays)
      .leftJoin(
        smartRotomUserReplays,
        and(
          eq(smartRotomUserReplays.replayId, smartRotomReplays.id),
          eq(smartRotomUserReplays.uuid, uuid),
        ),
      )
      .where(eq(smartRotomReplays.id, replayId))
      .limit(1);

    return result[0] || null;
  }
}
