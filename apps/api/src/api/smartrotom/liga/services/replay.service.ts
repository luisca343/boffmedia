import { Injectable } from '@nestjs/common';
import {
  LigaRepository,
  LeagueReplay,
} from '@api/smartrotom/liga/repositories/liga.repository';

@Injectable()
export class ReplayService {
  constructor(private readonly ligaRepository: LigaRepository) {}

  async getReplayById(id: number): Promise<LeagueReplay> {
    if (!id || id <= 0) {
      throw new Error('Valid replay ID is required');
    }

    const replay = await this.ligaRepository.findReplayById(id);
    if (!replay) {
      throw new Error('Replay not found');
    }

    return replay;
  }

  async getRecentReplays(limit: number = 10): Promise<LeagueReplay[]> {
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    return this.ligaRepository.findRecentReplays(limit);
  }

  async getPlayerReplays(playerUuid: string): Promise<LeagueReplay[]> {
    if (!playerUuid) {
      throw new Error('Player UUID is required');
    }

    return this.ligaRepository.findReplaysByPlayer(playerUuid);
  }

  async getMatchHistory(
    player1: string,
    player2: string,
  ): Promise<LeagueReplay[]> {
    if (!player1 || !player2) {
      throw new Error('Both player UUIDs are required');
    }

    if (player1 === player2) {
      throw new Error('Players must be different');
    }

    return this.ligaRepository.findReplaysByPlayers(player1, player2);
  }

  async validateReplayExists(id: number): Promise<boolean> {
    try {
      await this.getReplayById(id);
      return true;
    } catch {
      return false;
    }
  }
}
