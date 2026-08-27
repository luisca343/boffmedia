import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import {
  boffMediaEvents,
  boffMediaParticipants,
  boffMediaAchievements,
  boffMediaParticipantProgress,
  boffMediaEventParticipants,
  EVENT_STATUS,
} from '@/_db/schema/BoffMediaEvents';

export interface SiteCounts {
  users: number;
  events: number;
  activeEvents: number;
  participants: number;
  achievements: number;
}

export interface ActivityRow {
  /** Nullable: a participant may have no nickname set. */
  actor: string | null;
  name: string;
  /** Both source columns are NOT NULL, so this never widens to null. */
  icon: string;
  at: Date | null;
}

@Injectable()
export class CommunityRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /** Aggregate site-wide counters for the landing HUD. */
  async countSiteStats(): Promise<SiteCounts> {
    const [[users], [events], [activeEvents], [participants], [achievements]] =
      await Promise.all([
        this.db
          .select({ c: sql<number>`COUNT(*)` })
          .from(boffMediaUsers)
          // Exclude GDPR soft-deleted tombstones from the public count.
          .where(isNull(boffMediaUsers.deletedAt)),
        this.db
          .select({ c: sql<number>`COUNT(*)` })
          .from(boffMediaEvents)
          .where(isNull(boffMediaEvents.deletedAt)),
        this.db
          .select({ c: sql<number>`COUNT(*)` })
          .from(boffMediaEvents)
          .where(
            and(
              isNull(boffMediaEvents.deletedAt),
              eq(boffMediaEvents.status, EVENT_STATUS.ACTIVE),
            ),
          ),
        this.db
          .select({ c: sql<number>`COUNT(*)` })
          .from(boffMediaParticipants),
        this.db
          .select({ c: sql<number>`COUNT(*)` })
          .from(boffMediaAchievements)
          .where(isNull(boffMediaAchievements.deletedAt)),
      ]);

    return {
      users: Number(users?.c ?? 0),
      events: Number(events?.c ?? 0),
      activeEvents: Number(activeEvents?.c ?? 0),
      participants: Number(participants?.c ?? 0),
      achievements: Number(achievements?.c ?? 0),
    };
  }

  /**
   * Achievement unlocks, newest first.
   *
   * The visibility predicate is load-bearing: the feed is anonymous, so an
   * unlock may only surface when its achievement belongs to no event at all or
   * to a public one. Dropping it would leak private event names site-wide.
   */
  async findRecentUnlocks(limit: number): Promise<ActivityRow[]> {
    return this.db
      .select({
        actor: boffMediaParticipants.nickname,
        name: boffMediaAchievements.name,
        icon: boffMediaAchievements.icon,
        at: boffMediaParticipantProgress.completedAt,
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        and(
          eq(
            boffMediaAchievements.id,
            boffMediaParticipantProgress.achievementId,
          ),
          isNull(boffMediaAchievements.deletedAt),
        ),
      )
      .innerJoin(
        boffMediaParticipants,
        eq(
          boffMediaParticipants.id,
          boffMediaParticipantProgress.participantId,
        ),
      )
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId),
      )
      .where(
        and(
          eq(boffMediaParticipantProgress.isCompleted, true),
          or(
            isNull(boffMediaAchievements.eventId),
            eq(boffMediaEvents.visibility, 'public'),
          ),
        ),
      )
      .orderBy(desc(boffMediaParticipantProgress.completedAt))
      .limit(limit);
  }

  /** Event registrations on PUBLIC events only, newest first. */
  async findRecentJoins(limit: number): Promise<ActivityRow[]> {
    return this.db
      .select({
        actor: boffMediaParticipants.nickname,
        name: boffMediaEvents.title,
        icon: boffMediaEvents.icon,
        at: boffMediaEventParticipants.createdAt,
      })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaEvents,
        and(
          eq(boffMediaEvents.id, boffMediaEventParticipants.eventId),
          isNull(boffMediaEvents.deletedAt),
          eq(boffMediaEvents.visibility, 'public'),
        ),
      )
      .innerJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .orderBy(desc(boffMediaEventParticipants.createdAt))
      .limit(limit);
  }
}
