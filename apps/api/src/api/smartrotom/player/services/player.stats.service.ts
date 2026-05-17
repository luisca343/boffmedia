import { Injectable } from '@nestjs/common';
import { PlayerRepository } from '@api/smartrotom/player/repositories/player.repository';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PlayerStatsService {
  constructor(
    private readonly logger: Logger,
    private readonly playerRepository: PlayerRepository,
  ) {}

  async getPlayerStats(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('Player UUID is required');
    }

    try {
      return await this.playerRepository.fetchPlayerStatsFromAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get player stats for ${uuid}:`, error);
      throw new Error(`Player stats retrieval failed: ${error.message}`);
    }
  }
}
