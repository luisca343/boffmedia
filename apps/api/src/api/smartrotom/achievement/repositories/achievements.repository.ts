import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, asc, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IAchievementsRepository } from './interfaces/achievements.repository.interface';
import { CreateAchievementDto } from '../dto/create-achievement.dto';
import { UpdateAchievementDto } from '../dto/update-achievement.dto';
import { Achievement } from '../entities/achievement.entity';
import {
  SmartRotomAchievement,
  SmartRotomUserAchievement,
  smartRotomAchievements,
  smartRotomReplays,
  smartRotomUserAchievements,
  smartRotomUserReplays,
} from '@/_db/schema/SmartRotom';
import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';

@Injectable()
export class AchievementsRepository
  extends BaseRepositoryImpl<
    Achievement,
    CreateAchievementDto,
    UpdateAchievementDto
  >
  implements IAchievementsRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, smartRotomAchievements);
  }

  async create(data: CreateAchievementDto): Promise<Achievement> {
    await this.db
      .insert(smartRotomAchievements)
      .values(data as SmartRotomAchievement);
    return this.findByStringId(data.id) as Promise<Achievement>;
  }

  async update(id: number, data: UpdateAchievementDto): Promise<Achievement> {
    // For achievements, we need to handle string ID differently
    throw new Error('Use updateByStringId for achievements');
  }

  async delete(id: number): Promise<boolean> {
    // For achievements, we need to handle string ID differently
    throw new Error('Use deleteByStringId for achievements');
  }

  async updateByStringId(
    id: string,
    data: UpdateAchievementDto,
  ): Promise<Achievement> {
    await this.db
      .update(smartRotomAchievements)
      .set(data)
      .where(eq(smartRotomAchievements.id, id));
    return this.findByStringId(id) as Promise<Achievement>;
  }

  async deleteByStringId(id: string): Promise<boolean> {
    const result = await this.db
      .delete(smartRotomAchievements)
      .where(eq(smartRotomAchievements.id, id));
    return result[0].affectedRows > 0;
  }

  async findByStringId(id: string): Promise<Achievement | null> {
    const result = await this.db
      .select()
      .from(smartRotomAchievements)
      .where(eq(smartRotomAchievements.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findUserAchievements(uuid: string): Promise<any[]> {
    return this.db
      .select({
        id: smartRotomAchievements.id,
        battleId: smartRotomUserAchievements.dataId,
        name: smartRotomAchievements.name,
        description: smartRotomAchievements.description,
        icon: smartRotomAchievements.icon,
        category: smartRotomAchievements.category,
        subcategory: smartRotomAchievements.subcategory,
        progress: smartRotomUserAchievements.progress,
        completed: smartRotomUserAchievements.completed,
        completedAt: smartRotomUserAchievements.completedAt,
        uuid: smartRotomUserAchievements.uuid,
        team: smartRotomReplays.team1,
        replay: smartRotomReplays.replay,
        target: smartRotomAchievements.target,
        order: smartRotomAchievements.order,
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
        asc(smartRotomAchievements.subcategory),
        asc(smartRotomAchievements.name),
      );
  }

  async findUserAchievementById(
    uuid: string,
    achievementId: string,
  ): Promise<any | null> {
    const result = await this.db
      .select({
        id: smartRotomAchievements.id,
        battleId: smartRotomUserAchievements.dataId,
        name: smartRotomAchievements.name,
        description: smartRotomAchievements.description,
        icon: smartRotomAchievements.icon,
        category: smartRotomAchievements.category,
        subcategory: smartRotomAchievements.subcategory,
        progress: smartRotomUserAchievements.progress,
        completed: smartRotomUserAchievements.completed,
        completedAt: smartRotomUserAchievements.completedAt,
        uuid: smartRotomUserAchievements.uuid,
        team: smartRotomReplays.team1,
        replay: smartRotomReplays.replay,
        target: smartRotomAchievements.target,
        order: smartRotomAchievements.order,
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
      .where(eq(smartRotomAchievements.id, achievementId))
      .limit(1);

    return result[0] || null;
  }

  async findUserAchievementStatus(
    uuid: string,
    achievementId: string,
  ): Promise<any | null> {
    const result = await this.db
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
      .where(eq(smartRotomAchievements.id, achievementId))
      .limit(1);

    return result[0] || null;
  }

  async createUserAchievement(
    achievementData: any,
  ): Promise<BaseInsertResponse> {
    const result = await this.db
      .insert(smartRotomUserAchievements)
      .values(achievementData as SmartRotomUserAchievement);

    return { insertId: result[0].insertId };
  }

  async achievementExists(achievementId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: smartRotomAchievements.id })
      .from(smartRotomAchievements)
      .where(eq(smartRotomAchievements.id, achievementId))
      .limit(1);

    return result.length > 0;
  }
}
