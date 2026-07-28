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
  RotomReplay,
  RotomUserReplay,
  rotomReplays,
  rotomUserReplays,
} from '@/_db/schema/SmartRotom';
import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';

@Injectable()
export class ReplaysRepository
  extends BaseRepositoryImpl<Replay, CreateReplayFullDto, UpdateReplayDto>
  implements IReplaysRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, rotomReplays);
  }

  async create(data: CreateReplayFullDto): Promise<Replay> {
    const result = await this.db
      .insert(rotomReplays)
      .values(data as RotomReplay);
    return this.findById(result[0].insertId) as Promise<Replay>;
  }

  async update(id: number, data: UpdateReplayDto): Promise<Replay> {
    await this.db
      .update(rotomReplays)
      .set(data)
      .where(eq(rotomReplays.id, id));
    return this.findById(id) as Promise<Replay>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(rotomReplays)
      .where(eq(rotomReplays.id, id));
    return result[0].affectedRows > 0;
  }

  async createUserReplay(userReplayData: any): Promise<BaseInsertResponse> {
    const result = await this.db
      .insert(rotomUserReplays)
      .values(userReplayData as RotomUserReplay);

    return { insertId: result[0].insertId };
  }

  async findUserReplay(uuid: string, replayId: number): Promise<any | null> {
    const result = await this.db
      .select({
        id: rotomReplays.id,
        team1: rotomReplays.team1,
        team2: rotomReplays.team2,
        replay: rotomReplays.replay,
        winner: rotomReplays.winner,
        side1: rotomReplays.side1,
        side2: rotomReplays.side2,
        date: rotomReplays.createdAt,
      })
      .from(rotomReplays)
      .leftJoin(
        rotomUserReplays,
        and(
          eq(rotomUserReplays.replayId, rotomReplays.id),
          eq(rotomUserReplays.uuid, uuid),
        ),
      )
      .where(eq(rotomReplays.id, replayId))
      .limit(1);

    return result[0] || null;
  }
}
