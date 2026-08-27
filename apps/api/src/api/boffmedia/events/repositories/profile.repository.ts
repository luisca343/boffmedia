import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaParticipants,
  boffMediaParticipantProgress,
  boffMediaAchievements,
  boffMediaEventParticipants,
  boffMediaEvents,
} from '@/_db/schema/BoffMediaEvents';

export type AchievementRow = typeof boffMediaAchievements.$inferSelect;

export interface CompletedProgressRow {
  achievementId: number;
  completedAt: Date | null;
}

export interface UnlockRow {
  name: string;
  icon: string;
  points: number;
  eventId: number | null;
  at: Date | null;
}

export interface JoinRow {
  name: string;
  icon: string;
  eventId: number;
  at: Date | null;
}

@Injectable()
export class ProfileRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /** Every participant row bound to a BoffMedia user id. */
  async findParticipantIds(userId: number): Promise<number[]> {
    const rows = await this.db
      .select({ id: boffMediaParticipants.id })
      .from(boffMediaParticipants)
      .where(eq(boffMediaParticipants.userId, userId));
    return rows.map((r) => r.id);
  }

  /**
   * The whole visible achievement catalogue, in display order.
   *
   * `hidden` achievements are excluded here rather than by the caller: they are
   * a surprise mechanic, and a trophy case that listed them as "locked" would
   * give them away.
   */
  async findVisibleCatalogue(): Promise<AchievementRow[]> {
    return this.db
      .select()
      .from(boffMediaAchievements)
      .where(
        and(
          isNull(boffMediaAchievements.deletedAt),
          eq(boffMediaAchievements.hidden, false),
        ),
      )
      .orderBy(boffMediaAchievements.order);
  }

  async findCompletedProgress(
    participantIds: number[],
  ): Promise<CompletedProgressRow[]> {
    if (participantIds.length === 0) return [];
    return this.db
      .select({
        achievementId: boffMediaParticipantProgress.achievementId,
        completedAt: boffMediaParticipantProgress.completedAt,
      })
      .from(boffMediaParticipantProgress)
      .where(
        and(
          inArray(boffMediaParticipantProgress.participantId, participantIds),
          eq(boffMediaParticipantProgress.isCompleted, true),
        ),
      );
  }

  /**
   * Recent unlocks. `eventId` comes back with the row because the caller has to
   * filter private events out afterwards — it cannot be dropped from the
   * projection without breaking that check.
   */
  async findRecentUnlocks(
    participantIds: number[],
    limit: number,
  ): Promise<UnlockRow[]> {
    if (participantIds.length === 0) return [];
    return this.db
      .select({
        name: boffMediaAchievements.name,
        icon: boffMediaAchievements.icon,
        points: boffMediaAchievements.points,
        eventId: boffMediaAchievements.eventId,
        at: boffMediaParticipantProgress.completedAt,
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
          inArray(boffMediaParticipantProgress.participantId, participantIds),
          eq(boffMediaParticipantProgress.isCompleted, true),
        ),
      )
      .orderBy(desc(boffMediaParticipantProgress.completedAt))
      .limit(limit);
  }

  async findRecentJoins(
    participantIds: number[],
    limit: number,
  ): Promise<JoinRow[]> {
    if (participantIds.length === 0) return [];
    return this.db
      .select({
        name: boffMediaEvents.title,
        icon: boffMediaEvents.icon,
        eventId: boffMediaEvents.id,
        at: boffMediaEventParticipants.createdAt,
      })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaEventParticipants.eventId),
      )
      .where(
        and(
          inArray(boffMediaEventParticipants.participantId, participantIds),
          isNull(boffMediaEvents.deletedAt),
        ),
      )
      .orderBy(desc(boffMediaEventParticipants.createdAt))
      .limit(limit);
  }
}
