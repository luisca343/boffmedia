import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import {
  boffMediaEvents,
  boffMediaParticipants,
  boffMediaAchievements,
  boffMediaParticipantProgress,
  boffMediaEventParticipants,
  EVENT_STATUS,
} from '@/_db/schema/Events';
import {
  ActivityItemEntity,
  SiteStatsEntity,
} from './entities/community.entity';

@Injectable()
export class CommunityService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  /** Aggregate site-wide counters for the landing HUD. */
  async getSiteStats(): Promise<SiteStatsEntity> {
    const [[users], [events], [activeEvents], [participants], [achievements]] =
      await Promise.all([
        this.db.select({ c: sql<number>`COUNT(*)` }).from(boffMediaUsers),
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
   * Site-wide recent activity feed: achievement unlocks + event registrations
   * across every participant, newest first.
   */
  async getActivity(limit = 15): Promise<ActivityItemEntity[]> {
    const unlocks = await this.db
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
      .where(eq(boffMediaParticipantProgress.isCompleted, 1))
      .orderBy(desc(boffMediaParticipantProgress.completedAt))
      .limit(limit);

    const joins = await this.db
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
        ),
      )
      .innerJoin(
        boffMediaParticipants,
        eq(
          boffMediaParticipants.id,
          boffMediaEventParticipants.participantId,
        ),
      )
      .orderBy(desc(boffMediaEventParticipants.createdAt))
      .limit(limit);

    const items: ActivityItemEntity[] = [
      ...unlocks
        .filter((u) => u.at)
        .map((u) => ({
          type: 'achievement' as const,
          actor: u.actor ?? 'Anónimo',
          name: u.name,
          icon: u.icon,
          at: (u.at as Date).toISOString(),
        })),
      ...joins
        .filter((j) => j.at)
        .map((j) => ({
          type: 'event_join' as const,
          actor: j.actor ?? 'Anónimo',
          name: j.name,
          icon: j.icon,
          at: (j.at as Date).toISOString(),
        })),
    ];

    items.sort((a, b) => b.at.localeCompare(a.at));
    return items.slice(0, limit);
  }
}
