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
import { LeaderboardEntry } from '../entities/leaderboard.entity';

interface TeamLeaderboardEntry {
  teamId: number;
  teamName: string;
  teamTag: string;
  score: number;
  memberCount: number;
  rank?: number;
}

interface ParticipantRanking {
  participantId: number;
  globalRank: number;
  eventRank?: number;
  totalPoints: number;
  achievementCount: number;
  medalCount: number;
}

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class LeaderboardsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Get global leaderboard across all events.
   *
   * Driven from completed progress with inner joins so only participants who
   * have earned at least one (non-deleted) achievement/medal are aggregated —
   * this avoids scanning the whole participants table and padding the board
   * with zero-score rows. Point semantics are unchanged: only completed items
   * with a non-deleted achievement contribute.
   */
  async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    const results = await this.db
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
      .orderBy(desc(sql<number>`total_points`), desc(sql<Date>`last_updated`));

    // Add ranking
    return this.addRankingToResults(results);
  }

  /**
   * Get leaderboard for a specific event
   */
  async getEventLeaderboard(eventId: number): Promise<LeaderboardEntry[]> {
    const results = await this.db
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
      .orderBy(desc(sql<number>`total_points`), desc(sql<Date>`last_updated`));

    // Add ranking
    return this.addRankingToResults(results);
  }

  /**
   * Get team leaderboard for a specific event
   */
  async getTeamLeaderboard(eventId: number): Promise<TeamLeaderboardEntry[]> {
    const results = await this.db
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

    // Add ranking
    return results.map((result, index) => ({
      ...result,
      rank: index + 1,
    })) as unknown as TeamLeaderboardEntry[];
  }

  /**
   * Get participant's ranking across global and (optionally) a specific event.
   *
   * Instead of materializing the whole board to `.find()` one row, this reads
   * the participant's own aggregate directly, then derives their global rank
   * with a single grouped COUNT of participants ranked strictly above them —
   * matching the board's `(total_points DESC, last_updated DESC)` ordering.
   */
  async getParticipantRanking(
    participantId: number,
    eventId?: number,
  ): Promise<ParticipantRanking> {
    // The participant's own aggregate (bounded to their rows by the PK).
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

    const totalPoints = Number(own?.totalPoints ?? 0);
    const achievementCount = Number(own?.achievementCount ?? 0);
    const medalCount = Number(own?.medalCount ?? 0);
    // A participant with no completed items is not on the board → rank 0,
    // mirroring the previous `globalEntry?.rank || 0`.
    const isRanked = achievementCount + medalCount > 0;

    let globalRank = 0;
    if (isRanked) {
      const lastUpdated = own?.lastUpdated ?? null;

      // Per-participant totals; count those ranked strictly above this one.
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

      globalRank = Number(above?.count ?? 0) + 1;
    }

    let eventRank: number | undefined;
    if (eventId) {
      // Event boards are bounded to a single event, so materializing is cheap.
      const eventLeaderboard = await this.getEventLeaderboard(eventId);
      const eventEntry = eventLeaderboard.find(
        (entry) => entry.participantId === participantId,
      );
      eventRank = eventEntry?.rank;
    }

    return {
      participantId,
      globalRank,
      eventRank,
      totalPoints,
      achievementCount,
      medalCount,
    };
  }

  /**
   * Get top performers by achievement count
   */
  async getTopAchievers(
    limit: number = 10,
    eventId?: number,
  ): Promise<LeaderboardEntry[]> {
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

    const results = await this.db
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

    return this.addRankingToResults(results);
  }

  /**
   * Get leaderboard with pagination
   */
  async getLeaderboardWithPagination(
    page: number = 1,
    pageSize: number = 20,
    eventId?: number,
  ): Promise<{
    data: LeaderboardEntry[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * pageSize;

    // Get total count
    const countQuery = eventId
      ? this.getEventLeaderboardCountQuery(eventId)
      : this.getGlobalLeaderboardCountQuery();

    const [countResult] = await countQuery;
    const total = countResult.count;

    // Get paginated results
    const leaderboard = eventId
      ? await this.getEventLeaderboard(eventId)
      : await this.getGlobalLeaderboard();

    const paginatedResults = leaderboard.slice(offset, offset + pageSize);

    return {
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get recent achievements for leaderboard highlights
   */
  async getRecentAchievements(
    limit: number = 5,
    eventId?: number,
  ): Promise<
    {
      participantId: number;
      nickname: string;
      avatar: string;
      achievementName: string;
      achievementIcon: string;
      points: number;
      completedAt: Date;
    }[]
  > {
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
      .limit(limit) as unknown as {
      participantId: number;
      nickname: string;
      avatar: string;
      achievementName: string;
      achievementIcon: string;
      points: number;
      completedAt: Date;
    }[];
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private addRankingToResults(results: any[]): LeaderboardEntry[] {
    return results.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
  }

  private getGlobalLeaderboardCountQuery() {
    // Kept consistent with getGlobalLeaderboard: distinct participants with at
    // least one completed, non-deleted achievement/medal.
    return this.db
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
  }

  private getEventLeaderboardCountQuery(eventId: number) {
    return this.db
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
  }
}
