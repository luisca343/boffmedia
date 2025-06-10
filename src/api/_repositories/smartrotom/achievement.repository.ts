import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, asc, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  SmartRotomReplay,
  SmartRotomUserAchievement,
  SmartRotomUserReplay,
  smartRotomAchievements,
  smartRotomReplays,
  smartRotomUserAchievements,
  smartRotomUserReplays
} from '@/_db/schema/SmartRotom';

export interface AchievementDetails {
  id: string;
  battleId: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  subcategory: string;
  progress: number;
  completed: number;
  completedAt: Date;
  uuid: string;
  team: string;
  replay: string;
}

export interface UserAchievementStatus {
  id: string;
  completed: number;
}

export interface ReplayDetails {
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
export class AchievementRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== ACHIEVEMENT OPERATIONS ====================

  async findUserAchievements(uuid: string): Promise<AchievementDetails[]> {
    return this.db
      .select({
        id: smartRotomAchievements.id,
        battleId: smartRotomUserAchievements.dataId,
        name: smartRotomAchievements.name,
        description: smartRotomAchievements.description,
        icon: smartRotomAchievements.icon,
        category: smartRotomAchievements.category,
        subcategory: smartRotomAchievements.subcatecory,
        progress: smartRotomUserAchievements.progress,
        completed: smartRotomUserAchievements.completed,
        completedAt: smartRotomUserAchievements.completedAt,
        uuid: smartRotomUserAchievements.uuid,
        team: smartRotomReplays.team1,
        replay: smartRotomReplays.replay,
      })
      .from(smartRotomAchievements)
      .leftJoin(
        smartRotomUserAchievements,
        and(
          eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
          eq(smartRotomUserAchievements.uuid, uuid),
        ),
      )
      .leftJoin(
        smartRotomUserReplays,
        and(
          eq(smartRotomUserReplays.uuid, uuid),
          eq(smartRotomUserReplays.replayId, smartRotomUserAchievements.dataId),
        ),
      )
      .leftJoin(
        smartRotomReplays,
        eq(smartRotomReplays.id, smartRotomUserReplays.replayId),
      )
      .orderBy(
        asc(
          sql`CASE WHEN ${smartRotomUserAchievements.completedAt} IS NULL THEN 1 ELSE 0 END`,
        ),
        asc(smartRotomUserAchievements.completedAt),
        asc(smartRotomAchievements.order),
        asc(smartRotomAchievements.category),
        asc(smartRotomAchievements.subcatecory),
        asc(smartRotomAchievements.name),
      );
  }

  async findUserAchievementById(uuid: string, achievementId: string): Promise<AchievementDetails | null> {
    const result = await this.db
      .select({
        id: smartRotomAchievements.id,
        battleId: smartRotomUserAchievements.dataId,
        name: smartRotomAchievements.name,
        description: smartRotomAchievements.description,
        icon: smartRotomAchievements.icon,
        category: smartRotomAchievements.category,
        subcategory: smartRotomAchievements.subcatecory,
        progress: smartRotomUserAchievements.progress,
        completed: smartRotomUserAchievements.completed,
        completedAt: smartRotomUserAchievements.completedAt,
        uuid: smartRotomUserAchievements.uuid,
        team: smartRotomReplays.team1,
        replay: smartRotomReplays.replay,
      })
      .from(smartRotomAchievements)
      .leftJoin(
        smartRotomUserAchievements,
        and(
          eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
          eq(smartRotomUserAchievements.uuid, uuid),
        ),
      )
      .leftJoin(
        smartRotomUserReplays,
        and(
          eq(smartRotomUserReplays.uuid, uuid),
          eq(smartRotomUserReplays.replayId, smartRotomUserAchievements.dataId),
        ),
      )
      .leftJoin(
        smartRotomReplays,
        eq(smartRotomReplays.id, smartRotomUserReplays.replayId),
      )
      .where(eq(smartRotomAchievements.id, achievementId))
      .limit(1);

    return result[0] || null;
  }

  async findUserAchievementStatus(uuid: string, achievementId: string): Promise<UserAchievementStatus | null> {
    const result = await this.db
      .select({
        id: smartRotomAchievements.id,
        completed: smartRotomUserAchievements.completed,
      })
      .from(smartRotomAchievements)
      .leftJoin(
        smartRotomUserAchievements,
        and(
          eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
          eq(smartRotomUserAchievements.uuid, uuid),
        ),
      )
      .where(eq(smartRotomAchievements.id, achievementId))
      .limit(1);

    return result[0] || null;
  }

  async createUserAchievement(achievementData: {
    dataId: number;
    uuid: string;
    achievementId: string;
    progress: number;
    completed: number;
    completedAt: Date;
  }): Promise<{ insertId: number }> {
    const result = await this.db
      .insert(smartRotomUserAchievements)
      .values(achievementData as SmartRotomUserAchievement);

    return { insertId: result[0].insertId };
  }

  // ==================== REPLAY OPERATIONS ====================

  async createReplay(replayData: {
    side1: string;
    side2: string;
    team1: string;
    team2: string;
    replay: string;
    winner: string;
  }): Promise<{ insertId: number }> {
    const result = await this.db
      .insert(smartRotomReplays)
      .values(replayData as SmartRotomReplay);

    return { insertId: result[0].insertId };
  }

  async createUserReplay(userReplayData: {
    replayId: number;
    uuid: string;
    side: number;
  }): Promise<{ insertId: number }> {
    const result = await this.db
      .insert(smartRotomUserReplays)
      .values(userReplayData as SmartRotomUserReplay);

    return { insertId: result[0].insertId };
  }

  async findUserReplay(uuid: string, replayId: number): Promise<ReplayDetails | null> {
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
        ))
      .where(eq(smartRotomReplays.id, replayId))
      .limit(1);

    return result[0] || null;
  }
}