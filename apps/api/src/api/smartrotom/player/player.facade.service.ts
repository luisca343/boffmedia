import { HttpException, Injectable } from '@nestjs/common';
import { PlayerStatsService } from './services/player.stats.service';
import { PlayerTeamService } from './services/player.team.service';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PlayerFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly playerStatsService: PlayerStatsService,
    private readonly playerTeamService: PlayerTeamService,
  ) {}

  async getStats(uuid: string): Promise<any> {
    try {
      return await this.playerStatsService.getPlayerStats(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting player stats for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve player stats: ${error.message}`);
    }
  }

  async getTeam(uuid: string): Promise<any> {
    try {
      return await this.playerTeamService.getPlayerTeam(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting player team for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve player team: ${error.message}`);
    }
  }
}
