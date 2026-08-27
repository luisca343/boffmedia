import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, sql, isNull, or } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaParticipantProgress,
  boffMediaAchievements,
  boffMediaParticipants,
  boffMediaEvents,
  boffMediaEventTeams,
  boffMediaEventTeamMembers,
} from '@/_db/schema/BoffMediaEvents';

export interface OwnAggregateRow {
  totalPoints: number;
  achievementCount: number;
  medalCount: number;
  lastUpdated: Date | null;
}

export interface RecentAchievementRow {
  participantId: number;
  nickname: string;
  avatar: string;
  achievementName: string;
  achievementIcon: string;
  points: number;
  completedAt: Date;
}

/**
 * Every board query lives here, and they share one ordering contract:
 * `(total_points DESC, last_updated DESC, participant id ASC)`.
 *
 * That third key is not decoration. Without it two players on identical points
 * and an identical timestamp swap places between requests, and the board appears
 * to move when nothing has happened. `countRankedAbove` mirrors the first two
 * keys exactly, so a participant's derived rank agrees with where they actually
 * appear on the board.
 */
@Injectable()
export class LeaderboardsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Per-participant totals across every event.
   *
   * Driven from completed progress with inner joins so only participants who
   * have earned at least one (non-deleted) achievement/medal are aggregated —
   * this avoids scanning the whole participants table and padding the board
   * with zero-score rows.
   */
  async findGlobalTotals() {
    return this.db
      .select({
        participantId: boffMediaParticipants.id,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        achievementPoints:
          sql<number>`COALESCE(SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END), 0)`.as(
            'achievement_points',
          ),
        medalPoints:
          sql<number>`COALESCE(SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END), 0)`.as(
            'medal_points',
          ),
        totalPoints:
          sql<number>`COALESCE(SUM(${boffMediaAchievements.points}), 0)`.as(
            'total_points',
          ),
        achievementCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaParticipantProgress.achievementId} END)`.as(
            'achievement_count',
          ),
        medalCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaParticipantProgress.achievementId} END)`.as(
            'medal_count',
          ),
        lastUpdated:
          sql<Date>`MAX(${boffMediaParticipantProgress.lastUpdated})`.as(
            'last_updated',
          ),
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
          // A soft-deleted event's points must leave the board; server-wide
          // achievements (no event) always count.
          or(
            isNull(boffMediaAchievements.eventId),
            isNull(boffMediaEvents.deletedAt),
          ),
        ),
      )
      .groupBy(
        boffMediaParticipants.id,
        boffMediaParticipants.nickname,
        boffMediaParticipants.avatar,
        boffMediaParticipants.userId,
      )
      .orderBy(
        desc(sql<number>`total_points`),
        desc(sql<Date>`last_updated`),
        boffMediaParticipants.id,
      );
  }

  /** Per-participant totals within one event. */
  async findEventTotals(eventId: number) {
    return this.db
      .select({
        participantId: boffMediaParticipantProgress.participantId,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        achievementPoints:
          sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as(
            'achievement_points',
          ),
        medalPoints:
          sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as(
            'medal_points',
          ),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as(
          'total_points',
        ),
        achievementCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaParticipantProgress.achievementId} END)`.as(
            'achievement_count',
          ),
        medalCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaParticipantProgress.achievementId} END)`.as(
            'medal_count',
          ),
        lastUpdated:
          sql<Date>`COALESCE(MAX(${boffMediaParticipantProgress.lastUpdated}), NULL)`.as(
            'last_updated',
          ),
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(
          boffMediaAchievements.id,
          boffMediaParticipantProgress.achievementId,
        ),
      )
      .leftJoin(
        boffMediaParticipants,
        eq(
          boffMediaParticipants.id,
          boffMediaParticipantProgress.participantId,
        ),
      )
      .where(
        and(
          eq(boffMediaAchievements.eventId, eventId),
          eq(boffMediaParticipantProgress.isCompleted, true),
          // Deleting an achievement is the admin's way to un-award it.
          isNull(boffMediaAchievements.deletedAt),
        ),
      )
      .groupBy(
        boffMediaParticipantProgress.participantId,
        boffMediaParticipants.nickname,
        boffMediaParticipants.avatar,
        boffMediaParticipants.userId,
      )
      .orderBy(
        desc(sql<number>`total_points`),
        desc(sql<Date>`last_updated`),
        boffMediaParticipants.id,
      );
  }

  /** Team standings for one event, ordered by the stored total score. */
  async findTeamTotals(eventId: number) {
    return this.db
      .select({
        teamId: boffMediaEventTeams.id,
        teamName: boffMediaEventTeams.name,
        teamTag: boffMediaEventTeams.tag,
        score: boffMediaEventTeams.totalScore,
        memberCount:
          sql<number>`COUNT(DISTINCT ${boffMediaEventTeamMembers.participantId})`.as(
            'member_count',
          ),
      })
      .from(boffMediaEventTeams)
      .leftJoin(
        boffMediaEventTeamMembers,
        eq(boffMediaEventTeamMembers.teamId, boffMediaEventTeams.id),
      )
      .where(
        and(
          eq(boffMediaEventTeams.eventId, eventId),
          isNull(boffMediaEventTeams.deletedAt),
        ),
      )
      .groupBy(
        boffMediaEventTeams.id,
        boffMediaEventTeams.name,
        boffMediaEventTeams.tag,
        boffMediaEventTeams.totalScore,
      )
      .orderBy(desc(boffMediaEventTeams.totalScore));
  }

  /** One participant's own aggregate, bounded to their rows by the PK. */
  async findOwnAggregate(participantId: number): Promise<OwnAggregateRow> {
    const [own] = await this.db
      .select({
        totalPoints:
          sql<number>`COALESCE(SUM(${boffMediaAchievements.points}), 0)`.as(
            'total_points',
          ),
        achievementCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaParticipantProgress.achievementId} END)`.as(
            'achievement_count',
          ),
        medalCount:
          sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaParticipantProgress.achievementId} END)`.as(
            'medal_count',
          ),
        lastUpdated:
          sql<Date | null>`MAX(${boffMediaParticipantProgress.lastUpdated})`.as(
            'last_updated',
          ),
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
      .where(
        and(
          eq(boffMediaParticipantProgress.participantId, participantId),
          eq(boffMediaParticipantProgress.isCompleted, true),
        ),
      );

    return {
      totalPoints: Number(own?.totalPoints ?? 0),
      achievementCount: Number(own?.achievementCount ?? 0),
      medalCount: Number(own?.medalCount ?? 0),
      lastUpdated: own?.lastUpdated ?? null,
    };
  }

  /**
   * How many participants rank strictly above this score.
   *
   * This is what lets a single participant's rank be read without materializing
   * the whole board. The predicate mirrors the board's first two ordering keys,
   * so the number it returns is the position they would occupy on it.
   */
  async countRankedAbove(
    totalPoints: number,
    lastUpdated: Date | null,
  ): Promise<number> {
    const boardTotals = this.db
      .select({
        participantId: boffMediaParticipantProgress.participantId,
        totalPoints:
          sql<number>`COALESCE(SUM(${boffMediaAchievements.points}), 0)`.as(
            'total_points',
          ),
        lastUpdated:
          sql<Date>`MAX(${boffMediaParticipantProgress.lastUpdated})`.as(
            'last_updated',
          ),
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
      .where(eq(boffMediaParticipantProgress.isCompleted, true))
      .groupBy(boffMediaParticipantProgress.participantId)
      .as('board_totals');

    const [above] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boardTotals)
      .where(
        sql`${boardTotals.totalPoints} > ${totalPoints} OR (${boardTotals.totalPoints} = ${totalPoints} AND ${boardTotals.lastUpdated} > ${lastUpdated})`,
      );

    return Number(above?.count ?? 0);
  }

  /** Top performers by achievement count. Medals are excluded by design. */
  async findTopAchievers(limit: number, eventId?: number) {
    const whereConditions = [
      eq(boffMediaParticipantProgress.isCompleted, true),
      eq(boffMediaAchievements.itemType, 'achievement'),
      isNull(boffMediaAchievements.deletedAt),
    ];

    if (eventId) {
      whereConditions.push(eq(boffMediaAchievements.eventId, eventId));
    } else {
      whereConditions.push(isNull(boffMediaEvents.deletedAt));
    }

    return this.db
      .select({
        participantId: boffMediaParticipantProgress.participantId,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        achievementPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as(
          'achievement_points',
        ),
        medalPoints: sql<number>`0`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as(
          'total_points',
        ),
        achievementCount:
          sql<number>`COUNT(DISTINCT ${boffMediaParticipantProgress.achievementId})`.as(
            'achievement_count',
          ),
        medalCount: sql<number>`0`.as('medal_count'),
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(
          boffMediaAchievements.id,
          boffMediaParticipantProgress.achievementId,
        ),
      )
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId),
      )
      .leftJoin(
        boffMediaParticipants,
        eq(
          boffMediaParticipants.id,
          boffMediaParticipantProgress.participantId,
        ),
      )
      .where(and(...whereConditions))
      .groupBy(
        boffMediaParticipantProgress.participantId,
        boffMediaParticipants.nickname,
        boffMediaParticipants.avatar,
        boffMediaParticipants.userId,
      )
      .orderBy(desc(sql<number>`achievement_count`))
      .limit(limit);
  }

  /**
   * Distinct participants on the global board.
   *
   * Kept consistent with findGlobalTotals: at least one completed, non-deleted
   * achievement/medal. If the two ever diverge, pagination reports a total that
   * does not match the rows it pages over.
   */
  async countGlobalBoard(): Promise<number> {
    const [row] = await this.db
      .select({
        count:
          sql<number>`COUNT(DISTINCT ${boffMediaParticipantProgress.participantId})`.as(
            'count',
          ),
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
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId),
      )
      .where(
        and(
          eq(boffMediaParticipantProgress.isCompleted, true),
          or(
            isNull(boffMediaAchievements.eventId),
            isNull(boffMediaEvents.deletedAt),
          ),
        ),
      );
    return Number(row?.count ?? 0);
  }

  async countEventBoard(eventId: number): Promise<number> {
    const [row] = await this.db
      .select({
        count:
          sql<number>`COUNT(DISTINCT ${boffMediaParticipantProgress.participantId})`.as(
            'count',
          ),
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
          eq(boffMediaAchievements.eventId, eventId),
          eq(boffMediaParticipantProgress.isCompleted, true),
          isNull(boffMediaAchievements.deletedAt),
        ),
      );
    return Number(row?.count ?? 0);
  }

  /** Newest unlocks, for the leaderboard highlight strip. */
  async findRecentAchievements(
    limit: number,
    eventId?: number,
  ): Promise<RecentAchievementRow[]> {
    const whereConditions = [
      eq(boffMediaParticipantProgress.isCompleted, true),
      isNull(boffMediaAchievements.deletedAt),
    ];

    if (eventId) {
      whereConditions.push(eq(boffMediaAchievements.eventId, eventId));
    } else {
      whereConditions.push(isNull(boffMediaEvents.deletedAt));
    }

    return this.db
      .select({
        participantId: boffMediaParticipantProgress.participantId,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        achievementName: boffMediaAchievements.name,
        achievementIcon: boffMediaAchievements.icon,
        points: boffMediaAchievements.points,
        completedAt: boffMediaParticipantProgress.completedAt,
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(
          boffMediaAchievements.id,
          boffMediaParticipantProgress.achievementId,
        ),
      )
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId),
      )
      .leftJoin(
        boffMediaParticipants,
        eq(
          boffMediaParticipants.id,
          boffMediaParticipantProgress.participantId,
        ),
      )
      .where(and(...whereConditions))
      .orderBy(desc(boffMediaParticipantProgress.completedAt))
      .limit(limit) as unknown as Promise<RecentAchievementRow[]>;
  }
}
