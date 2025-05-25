import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { 
  boffMediaAchievements, 
  boffMediaEvents, 
  Achievement 
} from '@/_db/schema/Events';

@Injectable()
export class AchievementsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<Achievement[]> {
    return this.db.select({
      id: boffMediaAchievements.id,
      description: boffMediaAchievements.description,
      name: boffMediaAchievements.name,
      icon: boffMediaAchievements.icon,
      createdAt: boffMediaAchievements.createdAt,
      updatedAt: boffMediaAchievements.updatedAt,
      itemType: boffMediaAchievements.itemType,
      maxProgress: boffMediaAchievements.maxProgress,
      points: boffMediaAchievements.points,
      eventId: boffMediaAchievements.eventId,
      eventName: boffMediaEvents.title,
      category: boffMediaAchievements.category,
      rarity: boffMediaAchievements.rarity,
      hidden: boffMediaAchievements.hidden,
      order: boffMediaAchievements.order,
      deletedAt: boffMediaAchievements.deletedAt
    })
    .from(boffMediaAchievements)
    .leftJoin(boffMediaEvents, eq(boffMediaEvents.id, boffMediaAchievements.eventId))
    .where(isNull(boffMediaEvents.deletedAt));
  }

  async findById(id: number): Promise<Achievement> {
    const result = await this.db.select()
      .from(boffMediaAchievements)
      .leftJoin(boffMediaEvents, eq(boffMediaEvents.id, boffMediaAchievements.eventId))
      .where(and(
        eq(boffMediaAchievements.id, id),
        isNull(boffMediaEvents.deletedAt)
      ));
    
    if (!result.length) return null;
    return result[0].boffmedia_achievements as Achievement;
  }

  async findByEventId(eventId: number): Promise<Achievement[]> {
    return this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.eventId, eventId));
  }

  async create(achievementData: Partial<Achievement>): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaAchievements)
      .values({
        ...achievementData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Achievement);

    return { insertId: result[0].insertId };
  }

  async update(id: number, achievementData: Partial<Achievement>): Promise<void> {
    await this.db.update(boffMediaAchievements)
      .set({
        ...achievementData,
        updatedAt: new Date()
      } as Achievement)
      .where(eq(boffMediaAchievements.id, id));
  }

  async checkEventExists(eventId: number): Promise<boolean> {
    const eventCheck = await this.db.select({id: boffMediaEvents.id})
      .from(boffMediaEvents)
      .where(and(eq(boffMediaEvents.id, eventId), isNull(boffMediaEvents.deletedAt)));

    return eventCheck.length > 0;
  }
}