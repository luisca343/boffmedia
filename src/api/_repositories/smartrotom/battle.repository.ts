import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  smartRotomReplays, 
  smartRotomUserReplays,
  SmartRotomReplay,
  SmartRotomUserReplay
} from '@/_db/schema/SmartRotom';
import {
  BattleReplayResponse,
  ReplayData,
  UserReplayData,
  ReplayUpdateData
} from '@api/smartrotom/battle/types/battle.types';

@Injectable()
export class BattleRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findReplaysByUser(uuid: string): Promise<BattleReplayResponse[]> {
    return this.db.select({
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
    .where(eq(smartRotomUserReplays.uuid, uuid))
    .orderBy(desc(smartRotomReplays.id));
  }

  async findReplayById(replayId: number): Promise<BattleReplayResponse | null> {
    const result = await this.db.select({
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
    .where(eq(smartRotomReplays.id, replayId))
    .limit(1);

    return result[0] || null;
  }

  async createReplay(replayData: ReplayData): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartRotomReplays)
      .values({
        ...replayData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as SmartRotomReplay);
    
    return { insertId: result[0].insertId };
  }

  async createUserReplay(userReplayData: UserReplayData): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartRotomUserReplays)
      .values({
        uuid: userReplayData.uuid,
        replayId: userReplayData.replayId,
        side: userReplayData.side || 1
      } as SmartRotomUserReplay);
    
    return { insertId: result[0].insertId };
  }

  async findUserReplayByIds(uuid: string, replayId: number): Promise<SmartRotomUserReplay | null> {
    const result = await this.db.select()
      .from(smartRotomUserReplays)
      .where(and(
        eq(smartRotomUserReplays.uuid, uuid),
        eq(smartRotomUserReplays.replayId, replayId)
      ))
      .limit(1);

    return result[0] || null;
  }

  async updateReplay(replayId: number, replayData: ReplayUpdateData): Promise<void> {
    await this.db.update(smartRotomReplays)
      .set({
        ...replayData,
        updatedAt: new Date()
      } as Partial<SmartRotomReplay>)
      .where(eq(smartRotomReplays.id, replayId));
  }

  async deleteReplay(replayId: number): Promise<void> {
    await this.db.delete(smartRotomReplays)
      .where(eq(smartRotomReplays.id, replayId));
  }

  async deleteUserReplay(uuid: string, replayId: number): Promise<void> {
    await this.db.delete(smartRotomUserReplays)
      .where(and(
        eq(smartRotomUserReplays.uuid, uuid),
        eq(smartRotomUserReplays.replayId, replayId)
      ));
  }
}