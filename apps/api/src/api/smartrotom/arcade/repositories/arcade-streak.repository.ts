import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IArcadeStreakRepository } from './interfaces/arcade-streak.repository.interface';
import { CreateArcadeStreakDto } from '../dto/create-arcade-streak.dto';
import { UpdateArcadeStreakDto } from '../dto/update-arcade-streak.dto';
import { ArcadeStreak } from '../entities/arcade-streak.entity';
import {
  RotomArcadeStreak,
  rotomArcadeStreaks,
} from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeStreakRepository
  extends BaseRepositoryImpl<
    ArcadeStreak,
    CreateArcadeStreakDto,
    UpdateArcadeStreakDto
  >
  implements IArcadeStreakRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, rotomArcadeStreaks);
  }

  async create(data: CreateArcadeStreakDto): Promise<ArcadeStreak> {
    const result = await this.db.insert(rotomArcadeStreaks).values({
      uuid: data.uuid,
      streak: data.streak || 0,
      lastClaimed: data.lastClaimed ? new Date(data.lastClaimed) : null,
      lastBanner: data.lastBanner || null,
      totalClaims: data.totalClaims || 0,
    } as RotomArcadeStreak);
    return this.findById(result[0].insertId) as Promise<ArcadeStreak>;
  }

  async update(id: number, data: UpdateArcadeStreakDto): Promise<ArcadeStreak> {
    const updateData: Partial<RotomArcadeStreak> = {};
    if (data.uuid) updateData.uuid = data.uuid;
    if (typeof data.streak !== 'undefined') updateData.streak = data.streak;
    if (data.lastClaimed) updateData.lastClaimed = new Date(data.lastClaimed);
    if (data.lastBanner) updateData.lastBanner = data.lastBanner;
    if (typeof data.totalClaims !== 'undefined')
      updateData.totalClaims = data.totalClaims;

    await this.db
      .update(rotomArcadeStreaks)
      .set(updateData)
      .where(eq(rotomArcadeStreaks.id, id));
    return this.findById(id) as Promise<ArcadeStreak>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(rotomArcadeStreaks)
      .where(eq(rotomArcadeStreaks.id, id));
    return result[0].affectedRows > 0;
  }

  async findByUuid(uuid: string): Promise<RotomArcadeStreak> {
    const result = await this.db
      .select()
      .from(rotomArcadeStreaks)
      .where(eq(rotomArcadeStreaks.uuid, uuid))
      .limit(1);
    return result[0] || null;
  }

  async createUserStreak(streakData: any): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomArcadeStreaks).values({
      uuid: streakData.uuid,
      streak: streakData.streak || 0,
      lastClaimed: streakData.lastClaimed
        ? new Date(streakData.lastClaimed)
        : null,
      lastBanner: streakData.lastBanner || null,
      totalClaims: streakData.totalClaims || 0,
    } as RotomArcadeStreak);
    return { insertId: result[0].insertId };
  }

  async updateUserStreak(
    uuid: string,
    streakData: any,
  ): Promise<RotomArcadeStreak> {
    const updateData: Partial<RotomArcadeStreak> = {};
    if (typeof streakData.streak !== 'undefined')
      updateData.streak = streakData.streak;
    if (streakData.lastClaimed)
      updateData.lastClaimed = new Date(streakData.lastClaimed);
    if (streakData.lastBanner) updateData.lastBanner = streakData.lastBanner;
    if (typeof streakData.totalClaims !== 'undefined')
      updateData.totalClaims = streakData.totalClaims;

    await this.db
      .update(rotomArcadeStreaks)
      .set(updateData)
      .where(eq(rotomArcadeStreaks.uuid, uuid));
    return this.findByUuid(uuid) as Promise<RotomArcadeStreak>;
  }

  async resetStreak(uuid: string): Promise<boolean> {
    const result = await this.db
      .update(rotomArcadeStreaks)
      // last_claimed is NOT NULL in the DB (and ON UPDATE CURRENT_TIMESTAMP),
      // so the previous `lastClaimed: null` could only ever fail under strict
      // mode. Resetting the streak is the counter; the timestamp refreshes.
      .set({ streak: 0 })
      .where(eq(rotomArcadeStreaks.uuid, uuid));
    return result[0].affectedRows > 0;
  }

  async incrementStreak(uuid: string): Promise<RotomArcadeStreak> {
    await this.db
      .update(rotomArcadeStreaks)
      .set({
        streak: sql`${rotomArcadeStreaks.streak} + 1`,
        lastClaimed: new Date(),
        totalClaims: sql`${rotomArcadeStreaks.totalClaims} + 1`,
      } as any)
      .where(eq(rotomArcadeStreaks.uuid, uuid));
    return this.findByUuid(uuid) as Promise<RotomArcadeStreak>;
  }

  async canClaimToday(uuid: string): Promise<boolean> {
    const streak = await this.findByUuid(uuid);
    if (!streak || !streak.lastClaimed) return true;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Reset to start of day in UTC

    const lastClaim = new Date(streak.lastClaimed);
    lastClaim.setUTCHours(0, 0, 0, 0); // Reset to start of day in UTC

    return today.getTime() !== lastClaim.getTime();
  }

  async getStreakStats(uuid: string): Promise<RotomArcadeStreak | null> {
    return this.findByUuid(uuid);
  }
}
