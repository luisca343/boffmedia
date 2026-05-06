import { Injectable } from '@nestjs/common';
import { PlayerStatsService } from './services/player.stats.service';
import { PlayerTeamService } from './services/player.team.service';

@Injectable()
export class PlayerFacadeService {
  constructor(
    private readonly playerStatsService: PlayerStatsService,
    private readonly playerTeamService: PlayerTeamService,
  ) {}

  async getStats(uuid: string): Promise<any> {
    try {
      return await this.playerStatsService.getPlayerStats(uuid);
    } catch (error: any) {
      console.error(`Error getting player stats for ${uuid}:`, error);
      throw new Error(`Failed to retrieve player stats: ${error.message}`);
    }
  }

  async getTeam(uuid: string): Promise<any> {
    try {
      return await this.playerTeamService.getPlayerTeam(uuid);
    } catch (error: any) {
      console.error(`Error getting player team for ${uuid}:`, error);
      throw new Error(`Failed to retrieve player team: ${error.message}`);
    }
  }
}