import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, desc, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomReplays,
  rotomUserReplays,
} from '@/_db/schema/SmartRotom';

export interface LeagueReplay {
  id: number;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueMatch {
  id: number;
  player1: string;
  player2: string;
  winner: string;
  score: string;
  replayId?: number;
  tournamentId?: number;
  round?: number;
  createdAt: Date;
}

export interface Tournament {
  id: number;
  name: string;
  status: 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  maxParticipants: number;
  currentParticipants: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface LeagueStanding {
  player: string;
  wins: number;
  losses: number;
  winRate: number;
  points: number;
  rank: number;
}

@Injectable()
export class LigaRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== REPLAY OPERATIONS ====================

  async findReplayById(id: number): Promise<LeagueReplay | null> {
    const result = await this.db
      .select({
        id: rotomReplays.id,
        team1: rotomReplays.team1,
        team2: rotomReplays.team2,
        replay: rotomReplays.replay,
        winner: rotomReplays.winner,
        side1: rotomReplays.side1,
        side2: rotomReplays.side2,
        createdAt: rotomReplays.createdAt,
        updatedAt: rotomReplays.updatedAt,
      })
      .from(rotomReplays)
      .where(eq(rotomReplays.id, id))
      .limit(1);

    return (result[0] || null) as unknown as LeagueReplay | null;
  }

  async findRecentReplays(limit: number = 10): Promise<LeagueReplay[]> {
    return this.db
      .select({
        id: rotomReplays.id,
        team1: rotomReplays.team1,
        team2: rotomReplays.team2,
        replay: rotomReplays.replay,
        winner: rotomReplays.winner,
        side1: rotomReplays.side1,
        side2: rotomReplays.side2,
        createdAt: rotomReplays.createdAt,
        updatedAt: rotomReplays.updatedAt,
      })
      .from(rotomReplays)
      .orderBy(desc(rotomReplays.createdAt))
      .limit(limit) as unknown as LeagueReplay[];
  }

  async findReplaysByPlayer(playerUuid: string): Promise<LeagueReplay[]> {
    return this.db
      .select({
        id: rotomReplays.id,
        team1: rotomReplays.team1,
        team2: rotomReplays.team2,
        replay: rotomReplays.replay,
        winner: rotomReplays.winner,
        side1: rotomReplays.side1,
        side2: rotomReplays.side2,
        createdAt: rotomReplays.createdAt,
        updatedAt: rotomReplays.updatedAt,
      })
      .from(rotomReplays)
      .innerJoin(
        rotomUserReplays,
        eq(rotomReplays.id, rotomUserReplays.replayId),
      )
      .where(eq(rotomUserReplays.uuid, playerUuid))
      .orderBy(desc(rotomReplays.createdAt)) as unknown as LeagueReplay[];
  }

  async findReplaysByPlayers(
    player1: string,
    player2: string,
  ): Promise<LeagueReplay[]> {
    return this.db
      .select({
        id: rotomReplays.id,
        team1: rotomReplays.team1,
        team2: rotomReplays.team2,
        replay: rotomReplays.replay,
        winner: rotomReplays.winner,
        side1: rotomReplays.side1,
        side2: rotomReplays.side2,
        createdAt: rotomReplays.createdAt,
        updatedAt: rotomReplays.updatedAt,
      })
      .from(rotomReplays)
      .innerJoin(
        rotomUserReplays,
        eq(rotomReplays.id, rotomUserReplays.replayId),
      )
      .where(inArray(rotomUserReplays.uuid, [player1, player2]))
      .orderBy(desc(rotomReplays.createdAt)) as unknown as LeagueReplay[];
  }

  // ==================== STATISTICS OPERATIONS ====================

  async getPlayerStats(playerUuid: string): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  }> {
    const playerReplays = await this.findReplaysByPlayer(playerUuid);

    const totalMatches = playerReplays.length;
    const wins = playerReplays.filter(
      (replay) => replay.winner === playerUuid,
    ).length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      totalMatches,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100,
    };
  }

  async getLeaderboard(limit: number = 20): Promise<LeagueStanding[]> {
    // This would require a more complex query in a real implementation
    // For now, we'll simulate the logic
    const allReplays = await this.findRecentReplays(1000);
    const playerStats: {
      [key: string]: { wins: number; losses: number; totalMatches: number };
    } = {};

    // Count stats for each player
    for (const replay of allReplays) {
      const players = [replay.side1, replay.side2].filter(Boolean);

      for (const player of players) {
        if (!playerStats[player]) {
          playerStats[player] = { wins: 0, losses: 0, totalMatches: 0 };
        }

        playerStats[player].totalMatches++;

        if (replay.winner === player) {
          playerStats[player].wins++;
        } else {
          playerStats[player].losses++;
        }
      }
    }

    // Convert to leaderboard format
    const standings: LeagueStanding[] = Object.entries(playerStats)
      .map(([player, stats]) => ({
        player,
        wins: stats.wins,
        losses: stats.losses,
        winRate:
          stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0,
        points: stats.wins * 3 + stats.losses * 1, // 3 points for win, 1 for participation
        rank: 0, // Will be set after sorting
      }))
      .filter((standing) => standing.wins + standing.losses >= 5) // Minimum 5 matches
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      })
      .slice(0, limit);

    // Set ranks
    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    return standings;
  }

  // ==================== TOURNAMENT OPERATIONS (Future expansion) ====================

  async findActiveTournaments(): Promise<Tournament[]> {
    // Placeholder for future tournament functionality
    // This would require a tournaments table
    return [];
  }

  async findTournamentById(_tournamentId: number): Promise<Tournament | null> {
    // Placeholder for future tournament functionality
    return null;
  }

  async findTournamentMatches(_tournamentId: number): Promise<LeagueMatch[]> {
    // Placeholder for future tournament functionality
    return [];
  }
}
