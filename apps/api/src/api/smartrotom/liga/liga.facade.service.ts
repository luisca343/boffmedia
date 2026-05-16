import { Injectable } from '@nestjs/common';
import { ReplayService } from './services/replay.service';
import {
  StatisticsService,
  PlayerStatistics,
  LeaderboardResponse,
} from './services/statistics.service';
import {
  TournamentService,
  TournamentCreationRequest,
  TournamentRegistration,
} from './services/tournament.service';
import {
  LeagueReplay,
  LeagueStanding,
  Tournament,
  LeagueMatch,
} from '@api/smartrotom/liga/repositories/liga.repository';

@Injectable()
export class LigaFacadeService {
  constructor(
    private readonly replayService: ReplayService,
    private readonly statisticsService: StatisticsService,
    private readonly tournamentService: TournamentService,
  ) {}

  // ==================== REPLAY MANAGEMENT ====================

  async getReplayById(id: number): Promise<LeagueReplay> {
    try {
      return await this.replayService.getReplayById(id);
    } catch (error: any) {
      console.error(`Error getting replay ${id}:`, error);
      throw new Error(`Failed to retrieve replay: ${error.message}`);
    }
  }

  async getRecentReplays(limit: number = 10): Promise<LeagueReplay[]> {
    try {
      return await this.replayService.getRecentReplays(limit);
    } catch (error: any) {
      console.error('Error getting recent replays:', error);
      throw new Error(`Failed to retrieve recent replays: ${error.message}`);
    }
  }

  async getPlayerReplays(playerUuid: string): Promise<LeagueReplay[]> {
    try {
      return await this.replayService.getPlayerReplays(playerUuid);
    } catch (error: any) {
      console.error(`Error getting replays for player ${playerUuid}:`, error);
      throw new Error(`Failed to retrieve player replays: ${error.message}`);
    }
  }

  async getMatchHistory(
    player1: string,
    player2: string,
  ): Promise<LeagueReplay[]> {
    try {
      return await this.replayService.getMatchHistory(player1, player2);
    } catch (error: any) {
      console.error(
        `Error getting match history between ${player1} and ${player2}:`,
        error,
      );
      throw new Error(`Failed to retrieve match history: ${error.message}`);
    }
  }

  // ==================== STATISTICS MANAGEMENT ====================

  async getPlayerStatistics(playerUuid: string): Promise<PlayerStatistics> {
    try {
      return await this.statisticsService.getPlayerStatistics(playerUuid);
    } catch (error: any) {
      console.error(
        `Error getting statistics for player ${playerUuid}:`,
        error,
      );
      throw new Error(`Failed to retrieve player statistics: ${error.message}`);
    }
  }

  async getLeaderboard(limit: number = 20): Promise<LeaderboardResponse> {
    try {
      return await this.statisticsService.getLeaderboard(limit);
    } catch (error: any) {
      console.error('Error getting leaderboard:', error);
      throw new Error(`Failed to retrieve leaderboard: ${error.message}`);
    }
  }

  async getPlayerRanking(
    playerUuid: string,
  ): Promise<{ rank: number; totalPlayers: number } | null> {
    try {
      return await this.statisticsService.getPlayerRanking(playerUuid);
    } catch (error: any) {
      console.error(`Error getting ranking for player ${playerUuid}:`, error);
      throw new Error(`Failed to retrieve player ranking: ${error.message}`);
    }
  }

  async comparePlayerStatistics(
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
    try {
      return await this.statisticsService.comparePlayers(player1, player2);
    } catch (error: any) {
      console.error(
        `Error comparing players ${player1} and ${player2}:`,
        error,
      );
      throw new Error(`Failed to compare players: ${error.message}`);
    }
  }

  // ==================== TOURNAMENT MANAGEMENT ====================

  async getActiveTournaments(): Promise<Tournament[]> {
    try {
      return await this.tournamentService.getActiveTournaments();
    } catch (error: any) {
      console.error('Error getting active tournaments:', error);
      throw new Error(
        `Failed to retrieve active tournaments: ${error.message}`,
      );
    }
  }

  async getTournamentById(tournamentId: number): Promise<Tournament> {
    try {
      return await this.tournamentService.getTournamentById(tournamentId);
    } catch (error: any) {
      console.error(`Error getting tournament ${tournamentId}:`, error);
      throw new Error(`Failed to retrieve tournament: ${error.message}`);
    }
  }

  async getTournamentMatches(tournamentId: number): Promise<LeagueMatch[]> {
    try {
      return await this.tournamentService.getTournamentMatches(tournamentId);
    } catch (error: any) {
      console.error(
        `Error getting matches for tournament ${tournamentId}:`,
        error,
      );
      throw new Error(
        `Failed to retrieve tournament matches: ${error.message}`,
      );
    }
  }

  async createTournament(
    request: TournamentCreationRequest,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.tournamentService.createTournament(request);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      throw new Error(`Failed to create tournament: ${error.message}`);
    }
  }

  async registerForTournament(
    registration: TournamentRegistration,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.tournamentService.registerForTournament(registration);
    } catch (error: any) {
      console.error('Error registering for tournament:', error);
      throw new Error(`Failed to register for tournament: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validateReplayExists(id: number): Promise<boolean> {
    try {
      return await this.replayService.validateReplayExists(id);
    } catch (error: any) {
      console.error(`Error validating replay ${id}:`, error);
      return false;
    }
  }

  async validateTournamentExists(tournamentId: number): Promise<boolean> {
    try {
      return await this.tournamentService.validateTournamentExists(
        tournamentId,
      );
    } catch (error: any) {
      console.error(`Error validating tournament ${tournamentId}:`, error);
      return false;
    }
  }
}
