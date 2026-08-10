import { Injectable, Inject } from '@nestjs/common';
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
import { EventsRepository } from '../repositories/events.repository';

export interface UserTrophy {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  points: number;
  rarity: string | null;
  itemType: 'achievement' | 'medal';
  category: string;
  earned: boolean;
  completedAt: string | null;
}

export interface UserTrophies {
  earnedCount: number;
  totalCount: number;
  trophies: UserTrophy[];
}

export interface UserActivityItem {
  type: 'achievement' | 'event_join';
  name: string;
  icon: string;
  points: number | null;
  at: string;
}

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class ProfileService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly eventsRepository: EventsRepository,
  ) {}

  /** Private-event rows the viewer (not the profiled user) may not see. */
  private async hiddenEventIdsFor(
    eventIds: (number | null | undefined)[],
    viewer?: { includePrivate?: boolean; userId?: number },
  ): Promise<Set<number>> {
    if (viewer?.includePrivate) return new Set();
    return this.eventsRepository.hiddenPrivateEventIds(
      eventIds,
      viewer?.userId,
    );
  }

  /** Resolve every participant row bound to a BoffMedia user id. */
  private async getParticipantIds(userId: number): Promise<number[]> {
    const rows = await this.db
      .select({ id: boffMediaParticipants.id })
      .from(boffMediaParticipants)
      .where(eq(boffMediaParticipants.userId, userId));
    return rows.map((r) => r.id);
  }

  /**
   * The user's trophy case: the full non-hidden catalogue tagged with the
   * user's earned state (earned first, then locked by display order).
   */
  async getUserTrophies(
    userId: number,
    viewer?: { includePrivate?: boolean; userId?: number },
  ): Promise<UserTrophies> {
    const participantIds = await this.getParticipantIds(userId);

    const fullCatalogue = await this.db
      .select()
      .from(boffMediaAchievements)
      .where(
        and(
          isNull(boffMediaAchievements.deletedAt),
          eq(boffMediaAchievements.hidden, false),
        ),
      )
      .orderBy(boffMediaAchievements.order);

    // Private-event achievements are invisible to viewers who cannot see the
    // event — the trophy case is public.
    const hiddenEventIds = await this.hiddenEventIdsFor(
      fullCatalogue.map((a) => a.eventId),
      viewer,
    );
    const catalogue = fullCatalogue.filter(
      (a) => !a.eventId || !hiddenEventIds.has(a.eventId),
    );

    // Map of achievementId -> completedAt for this user's completed progress.
    const completed = new Map<number, Date | null>();
    if (participantIds.length > 0) {
      const progress = await this.db
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
      for (const p of progress) completed.set(p.achievementId, p.completedAt);
    }

    const trophies: UserTrophy[] = catalogue.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      points: a.points,
      rarity: a.rarity,
      itemType: a.itemType,
      category: a.category,
      earned: completed.has(a.id),
      completedAt: completed.has(a.id)
        ? (completed.get(a.id)?.toISOString() ?? null)
        : null,
    }));

    // Earned first (most recent unlock first), then locked in catalogue order.
    trophies.sort((x, y) => {
      if (x.earned !== y.earned) return x.earned ? -1 : 1;
      if (x.earned && y.earned)
        return (y.completedAt ?? '').localeCompare(x.completedAt ?? '');
      return 0;
    });

    return {
      // Count over the visible set, not the raw progress map — a hidden
      // private-event unlock must not leak through the counter either.
      earnedCount: trophies.filter((t) => t.earned).length,
      totalCount: catalogue.length,
      trophies,
    };
  }

  /**
   * A merged, time-ordered activity timeline for the user: achievement
   * unlocks + event registrations.
   */
  async getUserActivity(
    userId: number,
    limit = 15,
    viewer?: { includePrivate?: boolean; userId?: number },
  ): Promise<UserActivityItem[]> {
    const participantIds = await this.getParticipantIds(userId);
    if (participantIds.length === 0) return [];

    const rawUnlocks = await this.db
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

    const rawJoins = await this.db
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

    // A private event's title (and its achievements) must not surface in a
    // public timeline for viewers who cannot see the event.
    const hiddenEventIds = await this.hiddenEventIdsFor(
      [
        ...rawUnlocks.map((u) => u.eventId),
        ...rawJoins.map((j) => j.eventId),
      ],
      viewer,
    );
    const unlocks = rawUnlocks.filter(
      (u) => !u.eventId || !hiddenEventIds.has(u.eventId),
    );
    const joins = rawJoins.filter((j) => !hiddenEventIds.has(j.eventId));

    const items: UserActivityItem[] = [
      ...unlocks
        .filter((u) => u.at)
        .map((u) => ({
          type: 'achievement' as const,
          name: u.name,
          icon: u.icon,
          points: u.points,
          at: (u.at as Date).toISOString(),
        })),
      ...joins
        .filter((j) => j.at)
        .map((j) => ({
          type: 'event_join' as const,
          name: j.name,
          icon: j.icon,
          points: null,
          at: (j.at as Date).toISOString(),
        })),
    ];

    items.sort((a, b) => b.at.localeCompare(a.at));
    return items.slice(0, limit);
  }
}
