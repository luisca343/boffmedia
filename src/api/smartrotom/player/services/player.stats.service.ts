import { Injectable } from '@nestjs/common';
import { PlayerRepository } from '@repositories/smartrotom/player.repository';

@Injectable()
export class PlayerStatsService {
  constructor(
    private readonly playerRepository: PlayerRepository,
  ) {}

  async getPlayerStats(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('Player UUID is required');
    }

    try {
      return await this.playerRepository.fetchPlayerStatsFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get player stats for ${uuid}:`, error);
      throw new Error(`Player stats retrieval failed: ${error.message}`);
    }
  }
}