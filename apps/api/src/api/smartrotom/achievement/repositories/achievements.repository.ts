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
  RotomAchievement,
  RotomUserAchievement,
  rotomAchievements,
  rotomReplays,
  rotomUserAchievements,
  rotomUserReplays,
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
    super(db, rotomAchievements);
  }

  async create(data: CreateAchievementDto): Promise<Achievement> {
    await this.db.insert(rotomAchievements).values(data as RotomAchievement);
    return this.findByStringId(data.id) as Promise<Achievement>;
  }

  async update(_id: number, _data: UpdateAchievementDto): Promise<Achievement> {
    // For achievements, we need to handle string ID differently
    throw new Error('Use updateByStringId for achievements');
  }

  async delete(_id: number): Promise<boolean> {
    // For achievements, we need to handle string ID differently
    throw new Error('Use deleteByStringId for achievements');
  }

  async updateByStringId(
    id: string,
    data: UpdateAchievementDto,
  ): Promise<Achievement> {
    await this.db
      .update(rotomAchievements)
      .set(data)
      .where(eq(rotomAchievements.id, id));
    return this.findByStringId(id) as Promise<Achievement>;
  }

  async deleteByStringId(id: string): Promise<boolean> {
    const result = await this.db
      .delete(rotomAchievements)
      .where(eq(rotomAchievements.id, id));
    return result[0].affectedRows > 0;
  }

  async findByStringId(id: string): Promise<Achievement | null> {
    const result = await this.db
      .select()
      .from(rotomAchievements)
      .where(eq(rotomAchievements.id, id))
      .limit(1);
    return (result[0] || null) as unknown as Achievement | null;
  }

  async findUserAchievements(uuid: string): Promise<any[]> {
    // List view: exclude the large replay payload (fetch on demand in detail view).
    // Includes team info for display but not the full replay data.
    return this.db
      .select({
        id: rotomAchievements.id,
        battleId: rotomUserAchievements.dataId,
        name: rotomAchievements.name,
        description: rotomAchievements.description,
        icon: rotomAchievements.icon,
        category: rotomAchievements.category,
        subcategory: rotomAchievements.subcategory,
        progress: rotomUserAchievements.progress,
        completed: rotomUserAchievements.completed,
        completedAt: rotomUserAchievements.completedAt,
        uuid: rotomUserAchievements.uuid,
        team: rotomReplays.team1,
        target: rotomAchievements.target,
        order: rotomAchievements.order,
      })
      .from(rotomAchievements)
      .leftJoin(
        rotomUserAchievements,
        and(
          eq(rotomAchievements.id, rotomUserAchievements.achievementId),
          eq(rotomUserAchievements.uuid, uuid),
        ),
      )
      .leftJoin(
        rotomUserReplays,
        and(
          eq(rotomUserReplays.uuid, uuid),
          eq(rotomUserReplays.replayId, rotomUserAchievements.dataId),
        ),
      )
      .leftJoin(rotomReplays, eq(rotomReplays.id, rotomUserReplays.replayId))
      .orderBy(
        asc(
          sql`CASE WHEN ${rotomUserAchievements.completedAt} IS NULL THEN 1 ELSE 0 END`,
        ),
        asc(rotomUserAchievements.completedAt),
        asc(rotomAchievements.order),
        asc(rotomAchievements.category),
        asc(rotomAchievements.subcategory),
        asc(rotomAchievements.name),
      );
  }

  async findUserAchievementById(
    uuid: string,
    achievementId: string,
  ): Promise<any | null> {
    const result = await this.db
      .select({
        id: rotomAchievements.id,
        battleId: rotomUserAchievements.dataId,
        name: rotomAchievements.name,
        description: rotomAchievements.description,
        icon: rotomAchievements.icon,
        category: rotomAchievements.category,
        subcategory: rotomAchievements.subcategory,
        progress: rotomUserAchievements.progress,
        completed: rotomUserAchievements.completed,
        completedAt: rotomUserAchievements.completedAt,
        uuid: rotomUserAchievements.uuid,
        team: rotomReplays.team1,
        replay: rotomReplays.replay,
        target: rotomAchievements.target,
        order: rotomAchievements.order,
      })
      .from(rotomAchievements)
      .leftJoin(
        rotomUserAchievements,
        and(
          eq(rotomAchievements.id, rotomUserAchievements.achievementId),
          eq(rotomUserAchievements.uuid, uuid),
        ),
      )
      .leftJoin(
        rotomUserReplays,
        and(
          eq(rotomUserReplays.uuid, uuid),
          eq(rotomUserReplays.replayId, rotomUserAchievements.dataId),
        ),
      )
      .leftJoin(rotomReplays, eq(rotomReplays.id, rotomUserReplays.replayId))
      .where(eq(rotomAchievements.id, achievementId))
      .limit(1);

    return result[0] || null;
  }

  async findUserAchievementStatus(
    uuid: string,
    achievementId: string,
  ): Promise<any | null> {
    const result = await this.db
      .select({
        id: rotomAchievements.id,
        completed: rotomUserAchievements.completed,
      })
      .from(rotomAchievements)
      .leftJoin(
        rotomUserAchievements,
        and(
          eq(rotomAchievements.id, rotomUserAchievements.achievementId),
          eq(rotomUserAchievements.uuid, uuid),
        ),
      )
      .where(eq(rotomAchievements.id, achievementId))
      .limit(1);

    return result[0] || null;
  }

  async createUserAchievement(
    achievementData: any,
  ): Promise<BaseInsertResponse> {
    const result = await this.db
      .insert(rotomUserAchievements)
      .values(achievementData as RotomUserAchievement);

    return { insertId: result[0].insertId };
  }

  async achievementExists(achievementId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: rotomAchievements.id })
      .from(rotomAchievements)
      .where(eq(rotomAchievements.id, achievementId))
      .limit(1);

    return result.length > 0;
  }
}
