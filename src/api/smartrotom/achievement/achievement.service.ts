import { SmartRotomReplay, SmartRotomUserAchievement, SmartRotomUserReplay, smartRotomAchievements, smartRotomReplays, smartRotomUserAchievements, smartRotomUserReplays } from '@/_db/schema/SmartRotom';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, asc, sql, desc } from 'drizzle-orm';
import { BattleAchievementDto } from '../_dto/battle-achievement-dto';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class AchievementService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  async getAchievements(uuid: string) {
    return await this.db
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
          eq(
            smartRotomAchievements.id,
            smartRotomUserAchievements.achievementId,
          ),
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

  async getAchievementForPlayer(uuid: string, achievementId: string) {
    const data = await this.db
      .select({
        id: smartRotomAchievements.id,
        name: smartRotomAchievements.name,
        description: smartRotomAchievements.description,
        icon: smartRotomAchievements.icon,
        category: smartRotomAchievements.category,
        subcategory: smartRotomAchievements.subcatecory,
        progress: smartRotomUserAchievements.progress,
        completed: smartRotomUserAchievements.completed,
        completedAt: smartRotomUserAchievements.completedAt,
        uuid: smartRotomUserAchievements.uuid,
        replay: smartRotomReplays.replay,
      })
      .from(smartRotomAchievements)
      .leftJoin(
        smartRotomUserAchievements,
        and(
          eq(
            smartRotomAchievements.id,
            smartRotomUserAchievements.achievementId,
          ),
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
      .where(eq(smartRotomAchievements.id, achievementId));

    return data[0];
  }

  async playerHasAchievement(uuid: string, achievementId: string) {
    const data = await this.db
      .select({
        id: smartRotomAchievements.id,
        completed: smartRotomUserAchievements.completed,
      })
      .from(smartRotomAchievements)
      .leftJoin(
        smartRotomUserAchievements,
        and(
          eq(
            smartRotomAchievements.id,
            smartRotomUserAchievements.achievementId,
          ),
          eq(smartRotomUserAchievements.uuid, uuid),
        ),
      )
      .where(eq(smartRotomAchievements.id, achievementId));

    console.log('data', data);

    if (data.length === 0) return { error: 'Achievement not found' };
    const logro = data[0];
    return { completed: logro.completed };
  }

  async addBattleAchievement(battleAchievement: BattleAchievementDto) {
    console.log('battleAchievement', battleAchievement);
    const hasAchievement = await this.playerHasAchievement(
      battleAchievement.uuid,
      battleAchievement.logro,
    );

    const insert = await this.db
      .insert(smartRotomReplays)
      .values({
        side1: battleAchievement.name1,
        side2: battleAchievement.name2,
        team1: JSON.stringify(battleAchievement.team1),
        team2: JSON.stringify(battleAchievement.team2),
        replay: battleAchievement.replay,
        winner: battleAchievement.victoria ? 1 : 2,
      } as SmartRotomReplay)
      .execute();

    const insertId = insert[0].insertId;

    const insertRelation = await this.db
      .insert(smartRotomUserReplays)
      .values({
        replayId: insertId,
        uuid: battleAchievement.uuid,
        side: 1,
      } as SmartRotomUserReplay)
      .execute();

    const relationId = insertRelation[0].insertId;

    if (hasAchievement.error) return hasAchievement;
    if (hasAchievement.completed)
      return { error: 'Achievement already completed' };

    return this.db
      .insert(smartRotomUserAchievements)
      .values({
        dataId: insertId,
        uuid: battleAchievement.uuid,
        achievementId: battleAchievement.logro,
        progress: 1,
        completed: 1,
        completedAt: new Date(),
      } as SmartRotomUserAchievement)
      .execute();
  }

  
  
    async getReplay(uuid: string, replayId: number) {
      const replay = await this.db
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
        .where(
          eq(smartRotomReplays.id, replayId),
        )
        
        return replay.length > 0 ? replay[0] : null;
      }
  
}
