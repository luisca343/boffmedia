import { Injectable } from '@nestjs/common';
import { LeaderboardEntry } from '../entities/leaderboard.entity';
import {
  LeaderboardsRepository,
  RecentAchievementRow,
} from '../repositories/leaderboards.repository';

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

@Injectable()
export class LeaderboardsService {
  constructor(private readonly repo: LeaderboardsRepository) {}

  /**
   * Get global leaderboard across all events.
   *
   * Only participants who have earned at least one (non-deleted)
   * achievement/medal are aggregated, so the board is never padded with
   * zero-score rows.
   */
  async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.addRankingToResults(await this.repo.findGlobalTotals());
  }

  /**
   * Get leaderboard for a specific event
   */
  async getEventLeaderboard(eventId: number): Promise<LeaderboardEntry[]> {
    return this.addRankingToResults(await this.repo.findEventTotals(eventId));
  }

  /**
   * Get team leaderboard for a specific event
   */
  async getTeamLeaderboard(eventId: number): Promise<TeamLeaderboardEntry[]> {
    const results = await this.repo.findTeamTotals(eventId);

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
   * from a count of participants ranked strictly above them.
   */
  async getParticipantRanking(
    participantId: number,
    eventId?: number,
  ): Promise<ParticipantRanking> {
    const own = await this.repo.findOwnAggregate(participantId);

    // A participant with no completed items is not on the board → rank 0,
    // mirroring the previous `globalEntry?.rank || 0`.
    const isRanked = own.achievementCount + own.medalCount > 0;

    const globalRank = isRanked
      ? (await this.repo.countRankedAbove(own.totalPoints, own.lastUpdated)) + 1
      : 0;

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
      totalPoints: own.totalPoints,
      achievementCount: own.achievementCount,
      medalCount: own.medalCount,
    };
  }

  /**
   * Get top performers by achievement count
   */
  async getTopAchievers(
    limit: number = 10,
    eventId?: number,
  ): Promise<LeaderboardEntry[]> {
    return this.addRankingToResults(
      await this.repo.findTopAchievers(limit, eventId),
    );
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

    const total = eventId
      ? await this.repo.countEventBoard(eventId)
      : await this.repo.countGlobalBoard();

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
  ): Promise<RecentAchievementRow[]> {
    return this.repo.findRecentAchievements(limit, eventId);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private addRankingToResults(results: any[]): LeaderboardEntry[] {
    return results.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
  }
}
