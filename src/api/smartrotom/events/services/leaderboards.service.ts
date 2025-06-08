import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { 
  boffMediaParticipantProgress,
  boffMediaAchievements,
  boffMediaParticipants,
  boffMediaEvents,
  boffMediaEventTeams,
  boffMediaEventTeamMembers
} from '@/_db/schema/Events';

export interface LeaderboardEntry {
  participantId: number;
  nickname: string;
  avatar: string;
  userId: number;
  achievementPoints: number;
  medalPoints: number;
  totalPoints: number;
  achievementCount: number;
  medalCount: number;
  rank?: number;
}

export interface TeamLeaderboardEntry {
  teamId: number;
  teamName: string;
  teamTag: string;
  score: number;
  memberCount: number;
  rank?: number;
}

export interface ParticipantRanking {
  participantId: number;
  globalRank: number;
  eventRank?: number;
  totalPoints: number;
  achievementCount: number;
  medalCount: number;
}

@Injectable()
export class LeaderboardsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Get global leaderboard across all events
   */
  async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    const results = await this.db
      .select({
        participantId: boffMediaParticipants.id,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        achievementPoints: sql<number>`COALESCE(SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' AND ${boffMediaParticipantProgress.isCompleted} = 1 THEN ${boffMediaAchievements.points} ELSE 0 END), 0)`.as('achievement_points'),
        medalPoints: sql<number>`COALESCE(SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' AND ${boffMediaParticipantProgress.isCompleted} = 1 THEN ${boffMediaAchievements.points} ELSE 0 END), 0)`.as('medal_points'),
        totalPoints: sql<number>`COALESCE(SUM(CASE WHEN ${boffMediaParticipantProgress.isCompleted} = 1 THEN ${boffMediaAchievements.points} ELSE 0 END), 0)`.as('total_points'),
        achievementCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' AND ${boffMediaParticipantProgress.isCompleted} = 1 THEN ${boffMediaParticipantProgress.achievementId} END), 0)`.as('achievement_count'),
        medalCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' AND ${boffMediaParticipantProgress.isCompleted} = 1 THEN ${boffMediaParticipantProgress.achievementId} END), 0)`.as('medal_count')
      })
      .from(boffMediaParticipants)
      .leftJoin(
        boffMediaParticipantProgress,
        eq(boffMediaParticipantProgress.participantId, boffMediaParticipants.id)
      )
      .leftJoin(
        boffMediaAchievements,
        and(
          eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId),
          isNull(boffMediaAchievements.deletedAt)
        )
      )
      .leftJoin(
        boffMediaEvents,
        and(
          eq(boffMediaEvents.id, boffMediaAchievements.eventId),
          isNull(boffMediaEvents.deletedAt)
        )
      )
      .groupBy(
        boffMediaParticipants.id,
        boffMediaParticipants.nickname,
        boffMediaParticipants.avatar,
        boffMediaParticipants.userId
      )
      .orderBy(desc(sql<number>`total_points`));

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
        achievementPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('achievement_points'),
        medalPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('total_points'),
        achievementCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaParticipantProgress.achievementId} END)`.as('achievement_count'),
        medalCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaParticipantProgress.achievementId} END)`.as('medal_count')
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .leftJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaParticipantProgress.participantId)
      )
      .where(and(
        eq(boffMediaAchievements.eventId, eventId),
        eq(boffMediaParticipantProgress.isCompleted, 1)
      ))
      .groupBy(
        boffMediaParticipantProgress.participantId, 
        boffMediaParticipants.nickname, 
        boffMediaParticipants.avatar, 
        boffMediaParticipants.userId
      )
      .orderBy(desc(sql<number>`total_points`));

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
        memberCount: sql<number>`COUNT(DISTINCT ${boffMediaEventTeamMembers.participantId})`.as('member_count')
      })
      .from(boffMediaEventTeams)
      .leftJoin(
        boffMediaEventTeamMembers,
        eq(boffMediaEventTeamMembers.teamId, boffMediaEventTeams.id)
      )
      .where(and(
        eq(boffMediaEventTeams.eventId, eventId),
        isNull(boffMediaEventTeams.deletedAt)
      ))
      .groupBy(
        boffMediaEventTeams.id, 
        boffMediaEventTeams.name, 
        boffMediaEventTeams.tag, 
        boffMediaEventTeams.totalScore
      )
      .orderBy(desc(boffMediaEventTeams.totalScore));

    // Add ranking
    return results.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  }

  /**
   * Get participant's ranking across global and specific event
   */
  async getParticipantRanking(participantId: number, eventId?: number): Promise<ParticipantRanking> {
    // Get global ranking
    const globalLeaderboard = await this.getGlobalLeaderboard();
    const globalEntry = globalLeaderboard.find(entry => entry.participantId === participantId);
    
    let eventRank: number | undefined;
    if (eventId) {
      const eventLeaderboard = await this.getEventLeaderboard(eventId);
      const eventEntry = eventLeaderboard.find(entry => entry.participantId === participantId);
      eventRank = eventEntry?.rank;
    }

    return {
      participantId,
      globalRank: globalEntry?.rank || 0,
      eventRank,
      totalPoints: globalEntry?.totalPoints || 0,
      achievementCount: globalEntry?.achievementCount || 0,
      medalCount: globalEntry?.medalCount || 0
    };
  }

  /**
   * Get top performers by achievement count
   */
  async getTopAchievers(limit: number = 10, eventId?: number): Promise<LeaderboardEntry[]> {
    const whereConditions = [
      eq(boffMediaParticipantProgress.isCompleted, 1),
      eq(boffMediaAchievements.itemType, 'achievement')
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
        achievementPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('achievement_points'),
        medalPoints: sql<number>`0`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('total_points'),
        achievementCount: sql<number>`COUNT(DISTINCT ${boffMediaParticipantProgress.achievementId})`.as('achievement_count'),
        medalCount: sql<number>`0`.as('medal_count')
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId)
      )
      .leftJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaParticipantProgress.participantId)
      )
      .where(and(...whereConditions))
      .groupBy(
        boffMediaParticipantProgress.participantId, 
        boffMediaParticipants.nickname, 
        boffMediaParticipants.avatar, 
        boffMediaParticipants.userId
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
    eventId?: number
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
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * Get recent achievements for leaderboard highlights
   */
  async getRecentAchievements(limit: number = 5, eventId?: number): Promise<{
    participantId: number;
    nickname: string;
    avatar: string;
    achievementName: string;
    achievementIcon: string;
    points: number;
    completedAt: Date;
  }[]> {
    const whereConditions = [eq(boffMediaParticipantProgress.isCompleted, 1)];
    
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
        completedAt: boffMediaParticipantProgress.completedAt
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId)
      )
      .leftJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaParticipantProgress.participantId)
      )
      .where(and(...whereConditions))
      .orderBy(desc(boffMediaParticipantProgress.completedAt))
      .limit(limit);
  }

  // ==================== PRIVATE HELPER METHODS ====================
  
  private addRankingToResults(results: any[]): LeaderboardEntry[] {
    return results.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  }

  private getGlobalLeaderboardCountQuery() {
    return this.db
      .select({
        count: sql<number>`COUNT(DISTINCT ${boffMediaParticipantProgress.participantId})`.as('count')
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .leftJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaAchievements.eventId)
      )
      .where(and(
        eq(boffMediaParticipantProgress.isCompleted, 1),
        isNull(boffMediaEvents.deletedAt)
      ));
  }

  private getEventLeaderboardCountQuery(eventId: number) {
    return this.db
      .select({
        count: sql<number>`COUNT(DISTINCT ${boffMediaParticipantProgress.participantId})`.as('count')
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .where(and(
        eq(boffMediaAchievements.eventId, eventId),
        eq(boffMediaParticipantProgress.isCompleted, 1)
      ));
  }
}