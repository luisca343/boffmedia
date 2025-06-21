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
  SmartRotomArcadeStreak,
  smartRotomArcadeStreaks
} from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeStreakRepository 
  extends BaseRepositoryImpl<ArcadeStreak, CreateArcadeStreakDto, UpdateArcadeStreakDto> 
  implements IArcadeStreakRepository {

  constructor(
    @Inject(DRIZZLE) db: MySql2Database<Record<string, never>>,
  ) {
    super(db, smartRotomArcadeStreaks);
  }

  async create(data: CreateArcadeStreakDto): Promise<ArcadeStreak> {
    const result = await this.db.insert(smartRotomArcadeStreaks).values({
      uuid: data.uuid,
      streak: data.streak || 0,
      lastClaimed: data.lastClaimed ? new Date(data.lastClaimed) : null,
      lastBanner: data.lastBanner || null,
      totalClaims: data.totalClaims || 0
    } as SmartRotomArcadeStreak);
    return this.findById(result[0].insertId) as Promise<ArcadeStreak>;
  }

  async update(id: number, data: UpdateArcadeStreakDto): Promise<ArcadeStreak> {
    const updateData: Partial<SmartRotomArcadeStreak> = {};
    if (data.uuid) updateData.uuid = data.uuid;
    if (typeof data.streak !== 'undefined') updateData.streak = data.streak;
    if (data.lastClaimed) updateData.lastClaimed = new Date(data.lastClaimed);
    if (data.lastBanner) updateData.lastBanner = data.lastBanner;
    if (typeof data.totalClaims !== 'undefined') updateData.totalClaims = data.totalClaims;

    await this.db.update(smartRotomArcadeStreaks).set(updateData).where(eq(smartRotomArcadeStreaks.id, id));
    return this.findById(id) as Promise<ArcadeStreak>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(smartRotomArcadeStreaks).where(eq(smartRotomArcadeStreaks.id, id));
    return result[0].affectedRows > 0;
  }

  async findByUuid(uuid: string): Promise<SmartRotomArcadeStreak> {
    const result = await this.db.select()
      .from(smartRotomArcadeStreaks)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid))
      .limit(1);
    return result[0] || null;
  }

  async createUserStreak(streakData: any): Promise<{ insertId: number }> {
    const result = await this.db
      .insert(smartRotomArcadeStreaks)
      .values({
        uuid: streakData.uuid,
        streak: streakData.streak || 0,
        lastClaimed: streakData.lastClaimed ? new Date(streakData.lastClaimed) : null,
        lastBanner: streakData.lastBanner || null,
        totalClaims: streakData.totalClaims || 0
      } as SmartRotomArcadeStreak);
    return { insertId: result[0].insertId };
  }

  async updateUserStreak(uuid: string, streakData: any): Promise<SmartRotomArcadeStreak> {
    const updateData: Partial<SmartRotomArcadeStreak> = {};
    if (typeof streakData.streak !== 'undefined') updateData.streak = streakData.streak;
    if (streakData.lastClaimed) updateData.lastClaimed = new Date(streakData.lastClaimed);
    if (streakData.lastBanner) updateData.lastBanner = streakData.lastBanner;
    if (typeof streakData.totalClaims !== 'undefined') updateData.totalClaims = streakData.totalClaims;

    await this.db.update(smartRotomArcadeStreaks)
      .set(updateData)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid));
    return this.findByUuid(uuid) as Promise<SmartRotomArcadeStreak>;
  }

  async resetStreak(uuid: string): Promise<boolean> {
    const result = await this.db.update(smartRotomArcadeStreaks)
      .set({ 
        streak: 0,
        lastClaimed: null
      } as SmartRotomArcadeStreak)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid));
    return result[0].affectedRows > 0;
  }

  async incrementStreak(uuid: string): Promise<SmartRotomArcadeStreak> {
    await this.db.update(smartRotomArcadeStreaks)
      .set({ 
        streak: sql`${smartRotomArcadeStreaks.streak} + 1`,
        lastClaimed: new Date(),
        totalClaims: sql`${smartRotomArcadeStreaks.totalClaims} + 1`
      } as any)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid));
    return this.findByUuid(uuid) as Promise<SmartRotomArcadeStreak>;
  }

  async canClaimToday(uuid: string): Promise<boolean> {
    const streak = await this.findByUuid(uuid);
    if (!streak || !streak.lastClaimed) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const lastClaim = new Date(streak.lastClaimed);
    lastClaim.setHours(0, 0, 0, 0); // Reset to start of day
    
    return today.getTime() !== lastClaim.getTime();
  }

  async getStreakStats(uuid: string): Promise<SmartRotomArcadeStreak | null> {
    return this.findByUuid(uuid);
  }
}