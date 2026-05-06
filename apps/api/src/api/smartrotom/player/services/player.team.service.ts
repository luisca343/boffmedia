import { Injectable } from '@nestjs/common';
import { PlayerRepository } from '@api/smartrotom/player/repositories/player.repository';

@Injectable()
export class PlayerTeamService {
  constructor(
    private readonly playerRepository: PlayerRepository,
  ) {}

  async getPlayerTeam(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('Player UUID is required');
    }

    try {
      return await this.playerRepository.fetchPlayerTeamFromAPI(uuid);
    } catch (error: any) {
      console.error(`Failed to get player team for ${uuid}:`, error);
      throw new Error(`Player team retrieval failed: ${error.message}`);
    }
  }
}