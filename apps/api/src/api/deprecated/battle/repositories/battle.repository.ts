import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  smartRotomReplays,
  smartRotomUserReplays,
  SmartRotomReplay,
  SmartRotomUserReplay,
} from '@/_db/schema/SmartRotom';

export interface BattleReplay {
  id: number;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
  date: Date;
}

@Injectable()
export class BattleRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findReplaysByUser(uuid: string): Promise<BattleReplay[]> {
    return this.db
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
      .where(eq(smartRotomUserReplays.uuid, uuid))
      .orderBy(desc(smartRotomReplays.id));
  }

  async findReplayById(replayId: number): Promise<BattleReplay | null> {
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
      .where(eq(smartRotomReplays.id, replayId))
      .limit(1);

    return result[0] || null;
  }

  async createReplay(
    replayData: Partial<SmartRotomReplay>,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartRotomReplays).values({
      ...replayData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SmartRotomReplay);

    return { insertId: result[0].insertId };
  }

  async createUserReplay(
    userReplayData: Partial<SmartRotomUserReplay>,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartRotomUserReplays).values({
      ...userReplayData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SmartRotomUserReplay);

    return { insertId: result[0].insertId };
  }

  async findUserReplayByIds(
    uuid: string,
    replayId: number,
  ): Promise<SmartRotomUserReplay | null> {
    const result = await this.db
      .select()
      .from(smartRotomUserReplays)
      .where(
        and(
          eq(smartRotomUserReplays.uuid, uuid),
          eq(smartRotomUserReplays.replayId, replayId),
        ),
      )
      .limit(1);

    return result[0] || null;
  }

  async updateReplay(
    replayId: number,
    replayData: Partial<SmartRotomReplay>,
  ): Promise<void> {
    await this.db
      .update(smartRotomReplays)
      .set({
        ...replayData,
        updatedAt: new Date(),
      } as SmartRotomReplay)
      .where(eq(smartRotomReplays.id, replayId));
  }

  async deleteReplay(replayId: number): Promise<void> {
    await this.db
      .delete(smartRotomReplays)
      .where(eq(smartRotomReplays.id, replayId));
  }

  async deleteUserReplay(uuid: string, replayId: number): Promise<void> {
    await this.db
      .delete(smartRotomUserReplays)
      .where(
        and(
          eq(smartRotomUserReplays.uuid, uuid),
          eq(smartRotomUserReplays.replayId, replayId),
        ),
      );
  }
}
