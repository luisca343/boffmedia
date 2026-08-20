import { HttpException, Injectable } from '@nestjs/common';
import { WingullEconomyService } from './services/wingull-economy.service';
import { WingullPlayerService } from './services/wingull-player.service';
import { WingullWorldService } from './services/wingull-world.service';
import { WingullTransportService } from './services/wingull-transport.service';
import { WingullRepository } from './repositories/wingull.repository';
import { WingullBalanceDto } from './dto/wingull-balance.dto';
import { UpdateBattleTeamDto } from './dto/battle-team.dto';
import { TaxiStop } from './entities/taxi-stop.entity';
import { PlayerPosition } from './entities/player-position.entity';
import { TeleportOutcome } from './entities/teleport-outcome.entity';
import { PokemonW } from './entities/pokemon-w.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly wingullEconomyService: WingullEconomyService,
    private readonly wingullPlayerService: WingullPlayerService,
    private readonly wingullWorldService: WingullWorldService,
    private readonly wingullTransportService: WingullTransportService,
    private readonly wingullRepository: WingullRepository,
  ) {}

  // ==================== ECONOMY OPERATIONS ====================

  async updateBalance(balanceData: WingullBalanceDto): Promise<any> {
    try {
      return await this.wingullEconomyService.updateBalance(balanceData);
    } catch (error: any) {
      this.logger.error('Error updating balance:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update balance: ${error.message}`);
    }
  }

  async getCurrentBalance(uuid: string, amount?: number): Promise<number> {
    try {
      return await this.wingullEconomyService.getCurrentBalance(uuid, amount);
    } catch (error: any) {
      this.logger.error(`Error getting current balance for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get current balance: ${error.message}`);
    }
  }

  async getMoney(uuid: string): Promise<number> {
    try {
      return await this.wingullEconomyService.getMoney(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting money for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get money: ${error.message}`);
    }
  }

  // ==================== PLAYER OPERATIONS ====================

  async getStats(uuid: string): Promise<PlayerStats> {
    try {
      return await this.wingullPlayerService.getStats(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting stats for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  async getTeam(uuid: string): Promise<PokemonW[]> {
    try {
      return await this.wingullPlayerService.getTeam(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting team for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get team: ${error.message}`);
    }
  }

  async getPC(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerService.getPC(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting PC for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get PC: ${error.message}`);
    }
  }

  async movePokemon(movePokemonDto: any): Promise<any> {
    try {
      return await this.wingullPlayerService.movePokemon(movePokemonDto);
    } catch (error: any) {
      this.logger.error(`Error moving Pokémon:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to move Pokémon: ${error.message}`);
    }
  }

  async updateDex(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerService.updateDex(uuid);
    } catch (error: any) {
      this.logger.error(`Error updating dex for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update dex: ${error.message}`);
    }
  }

  async getQuests(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerService.getQuests(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting quests for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get quests: ${error.message}`);
    }
  }

  async sendMessage(uuid: string, message: string): Promise<any> {
    try {
      return await this.wingullPlayerService.sendMessage(uuid, message);
    } catch (error: any) {
      this.logger.error(`Error sending message to ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async globalchat(uuid: string, message: string): Promise<any> {
    try {
      return await this.wingullPlayerService.globalchat(uuid, message);
    } catch (error: any) {
      this.logger.error(
        `Error sending global chat message for ${uuid}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to send global chat message: ${error.message}`);
    }
  }

  async givePokemon(
    uuid: string,
    pokespec: string,
    sendMessage: boolean = true,
  ): Promise<any> {
    try {
      return await this.wingullPlayerService.givePokemon(
        uuid,
        pokespec,
        sendMessage,
      );
    } catch (error: any) {
      this.logger.error(`Error giving Pokémon to ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to give Pokémon: ${error.message}`);
    }
  }

  async giveItems(
    uuid: string,
    items: Array<{
      id: string;
      amount: number;
      display_name?: string;
      lore?: string[];
    }>,
  ): Promise<any> {
    try {
      return await this.wingullPlayerService.giveItems(uuid, items);
    } catch (error: any) {
      this.logger.error(`Error giving items to ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to give items: ${error.message}`);
    }
  }

  // The take-side of the bridge. Not shipped by the plugin yet: these throw, and the only
  // caller (WigglypopCustodyService, ATOMIC path) treats the throw as "roll back, charge nothing".
  async takePokemon(
    uuid: string,
    box: number,
    index: number,
    expectedKey: string,
  ): Promise<{ pokespec: string }> {
    try {
      return await this.wingullPlayerService.takePokemon(
        uuid,
        box,
        index,
        expectedKey,
      );
    } catch (error: any) {
      this.logger.error(`Error taking Pokémon from ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to take Pokémon: ${error.message}`);
    }
  }

  async takeItems(
    uuid: string,
    items: Array<{ id: string; amount: number }>,
  ): Promise<{ taken: Array<{ id: string; amount: number }> }> {
    try {
      return await this.wingullPlayerService.takeItems(uuid, items);
    } catch (error: any) {
      this.logger.error(`Error taking items from ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to take items: ${error.message}`);
    }
  }

  async getBattleTeams(uuid: string): Promise<any> {
    try {
      const data = await this.wingullPlayerService.getBattleTeams(uuid);

      // The battleteam is already an array of pokemon, wrap it as a single team
      if (data && data.battleteam) {
        const pokemon = Array.isArray(data.battleteam)
          ? data.battleteam
          : [data.battleteam];

        return {
          teams: [
            {
              id: 1,
              name: 'battleteam',
              pokemon: pokemon,
            },
          ],
          maxTeams: 5,
          activeTeamId: -1,
        };
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Error getting battle teams for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get battle teams: ${error.message}`);
    }
  }

  async updateBattleTeam(
    updateBattleTeamDto: UpdateBattleTeamDto,
  ): Promise<any> {
    try {
      return await this.wingullPlayerService.updateBattleTeam(
        updateBattleTeamDto,
      );
    } catch (error: any) {
      this.logger.error('Error updating battle team:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update battle team: ${error.message}`);
    }
  }

  // ==================== WORLD OPERATIONS ====================

  async getPerformance(): Promise<any> {
    try {
      return await this.wingullWorldService.getPerformance();
    } catch (error: any) {
      this.logger.error('Error getting performance data:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get performance data: ${error.message}`);
    }
  }

  async getRegions(): Promise<any> {
    try {
      return await this.wingullWorldService.getRegions();
    } catch (error: any) {
      this.logger.error('Error getting regions data:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get regions data: ${error.message}`);
    }
  }

  async getWeather(): Promise<any> {
    try {
      return await this.wingullWorldService.getWeather();
    } catch (error: any) {
      this.logger.error('Error getting weather data:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get weather data: ${error.message}`);
    }
  }

  async updateNPCs(data: any): Promise<any> {
    try {
      return await this.wingullWorldService.updateNPCs(data);
    } catch (error: any) {
      this.logger.error('Error updating NPCs:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update NPCs: ${error.message}`);
    }
  }

  async getWorldGuardWorlds(): Promise<{ id: number; name: string }[]> {
    return await this.wingullRepository.getWorldGuardWorlds();
  }

  // ==================== TRANSPORTATION OPERATIONS ====================

  async getTaxiStops(): Promise<TaxiStop[]> {
    try {
      return await this.wingullTransportService.getTaxiStops();
    } catch (error: any) {
      this.logger.error('Error getting taxi stops:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get taxi stops: ${error.message}`);
    }
  }

  async getPlayerPosition(uuid: string): Promise<PlayerPosition> {
    try {
      return await this.wingullTransportService.getPlayerPosition(uuid);
    } catch (error: any) {
      this.logger.error(`Error reading the position of ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to read player position: ${error.message}`);
    }
  }

  // Not wrapped in a try/catch: a refusal is a value here, not an exception, and the caller
  // decides whether it means "charge nothing" or "check whether it happened anyway".
  async teleportPlayer(id: string, uuid: string): Promise<TeleportOutcome> {
    return this.wingullTransportService.teleportPlayer(id, uuid);
  }

  async getPlayersOwnedRegions(uuid: string): Promise<
    {
      region_id: string;
      world_id: number;
      owner: boolean;
      name: string;
      uuid: string;
    }[]
  > {
    return await this.wingullRepository.getPlayersOwnedRegions(uuid);
  }

  async getAllPlots(): Promise<any[]> {
    return await this.wingullRepository.getAllPlots();
  }
}
