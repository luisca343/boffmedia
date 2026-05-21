import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaAchievements,
  boffMediaEvents,
  Achievement,
  boffMediaParticipantProgress,
} from '@/_db/schema/Events';

export interface AchievementWithEventName extends Achievement {
  eventName?: string;
}

export interface ParticipantProgressWithAchievement {
  participantId: number;
  achievementId: number;
  currentProgress: number;
  isCompleted: number;
  completedAt: Date | null;
  lastUpdated: Date;
  achievement: {
    id: number;
    name: string;
    description: string | null;
    icon: string;
    maxProgress: number;
    points: number;
    category: string;
    rarity: string | null;
    itemType: string;
    eventId?: number;
  };
}

@Injectable()
export class AchievementsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private readonly achievementSelect = {
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
    category: boffMediaAchievements.category,
    rarity: boffMediaAchievements.rarity,
    hidden: boffMediaAchievements.hidden,
    order: boffMediaAchievements.order,
    deletedAt: boffMediaAchievements.deletedAt,
  };

  private readonly achievementWithEventSelect = {
    ...this.achievementSelect,
    eventName: boffMediaEvents.title,
  };

  private readonly achievementProgressSelect = {
    participantId: boffMediaParticipantProgress.participantId,
    achievementId: boffMediaParticipantProgress.achievementId,
    currentProgress: boffMediaParticipantProgress.currentProgress,
    isCompleted: boffMediaParticipantProgress.isCompleted,
    completedAt: boffMediaParticipantProgress.completedAt,
    lastUpdated: boffMediaParticipantProgress.lastUpdated,
  };

  private readonly nestedAchievementSelect = {
    id: boffMediaAchievements.id,
    name: boffMediaAchievements.name,
    description: boffMediaAchievements.description,
    icon: boffMediaAchievements.icon,
    maxProgress: boffMediaAchievements.maxProgress,
    points: boffMediaAchievements.points,
    category: boffMediaAchievements.category,
    rarity: boffMediaAchievements.rarity,
    itemType: boffMediaAchievements.itemType,
    hidden: boffMediaAchievements.hidden,
  };

  private readonly nestedAchievementWithEventSelect = {
    ...this.nestedAchievementSelect,
    eventId: boffMediaAchievements.eventId,
  };

  async findAll(): Promise<AchievementWithEventName[]> {
    return this.db
      .select(this.achievementWithEventSelect)
      .from(boffMediaAchievements)
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId),
      )
      .where(
        isNull(boffMediaEvents.deletedAt),
      ) as unknown as AchievementWithEventName[];
  }

  async findById(id: number): Promise<Achievement | null> {
    const result = await this.db
      .select(this.achievementSelect)
      .from(boffMediaAchievements)
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId),
      )
      .where(
        and(
          eq(boffMediaAchievements.id, id),
          isNull(boffMediaAchievements.deletedAt),
          isNull(boffMediaEvents.deletedAt),
        ),
      );

    if (!result.length) return null;
    return result[0];
  }

  async findByEventId(eventId: number): Promise<Achievement[]> {
    return this.db
      .select(this.achievementSelect)
      .from(boffMediaAchievements)
      .where(
        and(
          eq(boffMediaAchievements.eventId, eventId),
          isNull(boffMediaAchievements.deletedAt),
        ),
      );
  }

  async create(
    achievementData: Partial<Achievement>,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaAchievements).values({
      ...achievementData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Achievement);

    return { insertId: result[0].insertId };
  }

  async update(
    id: number,
    achievementData: Partial<Achievement>,
  ): Promise<void> {
    await this.db
      .update(boffMediaAchievements)
      .set({
        ...achievementData,
        updatedAt: new Date(),
      } as Achievement)
      .where(eq(boffMediaAchievements.id, id));
  }

  async checkEventExists(eventId: number): Promise<boolean> {
    const eventCheck = await this.db
      .select({ id: boffMediaEvents.id })
      .from(boffMediaEvents)
      .where(
        and(eq(boffMediaEvents.id, eventId), isNull(boffMediaEvents.deletedAt)),
      );

    return eventCheck.length > 0;
  }

  async getParticipantProgress(
    participantId: number,
  ): Promise<ParticipantProgressWithAchievement[]> {
    return this.db
      .select({
        ...this.achievementProgressSelect,
        achievement: this.nestedAchievementSelect,
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(
          boffMediaAchievements.id,
          boffMediaParticipantProgress.achievementId,
        ),
      )
      .where(eq(boffMediaParticipantProgress.participantId, participantId));
  }

  async getParticipantProgressByEvent(
    participantId: number,
    eventId: number,
  ): Promise<ParticipantProgressWithAchievement[]> {
    return this.db
      .select({
        ...this.achievementProgressSelect,
        achievement: this.nestedAchievementWithEventSelect,
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(
          boffMediaAchievements.id,
          boffMediaParticipantProgress.achievementId,
        ),
      )
      .where(
        and(
          eq(boffMediaParticipantProgress.participantId, participantId),
          eq(boffMediaAchievements.eventId, eventId),
        ),
      ) as unknown as ParticipantProgressWithAchievement[];
  }
}
