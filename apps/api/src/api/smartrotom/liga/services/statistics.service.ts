import { Injectable } from '@nestjs/common';
import {
  LigaRepository,
  LeagueStanding,
} from '@api/smartrotom/liga/repositories/liga.repository';

export interface PlayerStatistics {
  uuid: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  points: number;
  rank?: number;
  recentForm?: ('W' | 'L')[];
}

export interface LeaderboardResponse {
  rankings: LeagueStanding[];
  totalPlayers: number;
  lastUpdated: Date;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly ligaRepository: LigaRepository) {}

  async getPlayerStatistics(playerUuid: string): Promise<PlayerStatistics> {
    if (!playerUuid) {
      throw new Error('Player UUID is required');
    }

    const stats = await this.ligaRepository.getPlayerStats(playerUuid);
    const recentReplays =
      await this.ligaRepository.findReplaysByPlayer(playerUuid);

    // Get recent form (last 10 matches)
    const recentForm = recentReplays
      .slice(0, 10)
      .map((replay) => (replay.winner === playerUuid ? 'W' : 'L')) as (
      | 'W'
      | 'L'
    )[];

    return {
      uuid: playerUuid,
      totalMatches: stats.totalMatches,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.winRate,
      points: stats.wins * 3 + stats.losses * 1,
      recentForm,
    };
  }

  async getLeaderboard(limit: number = 20): Promise<LeaderboardResponse> {
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const rankings = await this.ligaRepository.getLeaderboard(limit);

    return {
      rankings,
      totalPlayers: rankings.length,
      lastUpdated: new Date(),
    };
  }

  async getPlayerRanking(
    playerUuid: string,
  ): Promise<{ rank: number; totalPlayers: number } | null> {
    if (!playerUuid) {
      throw new Error('Player UUID is required');
    }

    const fullLeaderboard = await this.ligaRepository.getLeaderboard(1000);
    const playerRanking = fullLeaderboard.find(
      (standing) => standing.player === playerUuid,
    );

    if (!playerRanking) {
      return null;
    }

    return {
      rank: playerRanking.rank,
      totalPlayers: fullLeaderboard.length,
    };
  }

  async comparePlayers(
    player1: string,
    player2: string,
  ): Promise<{
    player1Stats: PlayerStatistics;
    player2Stats: PlayerStatistics;
    headToHead: {
      player1Wins: number;
      player2Wins: number;
      totalMatches: number;
    };
  }> {
    if (!player1 || !player2) {
      throw new Error('Both player UUIDs are required');
    }

    if (player1 === player2) {
      throw new Error('Players must be different');
    }

    const [player1Stats, player2Stats] = await Promise.all([
      this.getPlayerStatistics(player1),
      this.getPlayerStatistics(player2),
    ]);

    const headToHeadReplays = await this.ligaRepository.findReplaysByPlayers(
      player1,
      player2,
    );

    const player1Wins = headToHeadReplays.filter(
      (replay) => replay.winner === player1,
    ).length;
    const player2Wins = headToHeadReplays.filter(
      (replay) => replay.winner === player2,
    ).length;

    return {
      player1Stats,
      player2Stats,
      headToHead: {
        player1Wins,
        player2Wins,
        totalMatches: headToHeadReplays.length,
      },
    };
  }
}
