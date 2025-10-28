import { Injectable } from '@nestjs/common';
import { WingullEconomyService } from './services/wingull-economy.service';
import { WingullPlayerService } from './services/wingull-player.service';
import { WingullWorldService } from './services/wingull-world.service';
import { WingullTransportService } from './services/wingull-transport.service';
import { WingullRepository } from './repositories/wingull.repository';
import { WingullBalanceDto } from './dto/wingull-balance.dto';
import { UpdateBattleTeamDto } from './dto/battle-team.dto';
import { TaxiStop } from './entities/taxi-stop.entity';
import { PokemonW } from './entities/pokemon-w-.entity';
import { PlayerStats } from './entities/player-stats.entity';

@Injectable()
export class WingullFacadeService {
  constructor(
    private readonly wingullEconomyService: WingullEconomyService,
    private readonly wingullPlayerService: WingullPlayerService,
    private readonly wingullWorldService: WingullWorldService,
    private readonly wingullTransportService: WingullTransportService,
    private readonly wingullRepository: WingullRepository
  ) {}
  
  // ==================== ECONOMY OPERATIONS ====================
  
  async updateBalance(balanceData: WingullBalanceDto): Promise<any> {
    try {
      return await this.wingullEconomyService.updateBalance(balanceData);
    } catch (error) {
      console.error('Error updating balance:', error);
      throw new Error(`Failed to update balance: ${error.message}`);
    }
  }
  
  async getCurrentBalance(uuid: string, amount?: number): Promise<number> {
    try {
      return await this.wingullEconomyService.getCurrentBalance(uuid, amount);
    } catch (error) {
      console.error(`Error getting current balance for ${uuid}:`, error);
      throw new Error(`Failed to get current balance: ${error.message}`);
    }
  }
  
  async getMoney(uuid: string): Promise<number> {
    try {
      return await this.wingullEconomyService.getMoney(uuid);
    } catch (error) {
      console.error(`Error getting money for ${uuid}:`, error);
      throw new Error(`Failed to get money: ${error.message}`);
    }
  }
  
  // ==================== PLAYER OPERATIONS ====================
  
  async getStats(uuid: string): Promise<PlayerStats> {
    try {
      return await this.wingullPlayerService.getStats(uuid);
    } catch (error) {
      console.error(`Error getting stats for ${uuid}:`, error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
  
  async getTeam(uuid: string): Promise<PokemonW[]> {
    try {
      return await this.wingullPlayerService.getTeam(uuid);
    } catch (error) {
      console.error(`Error getting team for ${uuid}:`, error);
      throw new Error(`Failed to get team: ${error.message}`);
    }
  }

  async getPC(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerService.getPC(uuid);
    } catch (error) {
      console.error(`Error getting PC for ${uuid}:`, error);
      throw new Error(`Failed to get PC: ${error.message}`);
    }
  }

  async movePokemon(movePokemonDto: any): Promise<any> {
    try {
      return await this.wingullPlayerService.movePokemon(movePokemonDto);
    } catch (error) {
      console.error(`Error moving Pokémon:`, error);
      throw new Error(`Failed to move Pokémon: ${error.message}`);
    }
  }

  async updateDex(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerService.updateDex(uuid);
    } catch (error) {
      console.error(`Error updating dex for ${uuid}:`, error);
      throw new Error(`Failed to update dex: ${error.message}`);
    }
  }
  
  async getQuests(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerService.getQuests(uuid);
    } catch (error) {
      console.error(`Error getting quests for ${uuid}:`, error);
      throw new Error(`Failed to get quests: ${error.message}`);
    }
  }
  
  async sendMessage(uuid: string, message: string): Promise<any> {
    try {
      return await this.wingullPlayerService.sendMessage(uuid, message);
    } catch (error) {
      console.error(`Error sending message to ${uuid}:`, error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
  
  async givePokemon(uuid: string, pokespec: string, sendMessage: boolean = true): Promise<any> {
    try {
      return await this.wingullPlayerService.givePokemon(uuid, pokespec, sendMessage);
    } catch (error) {
      console.error(`Error giving Pokémon to ${uuid}:`, error);
      throw new Error(`Failed to give Pokémon: ${error.message}`);
    }
  }
  
  async giveItems(uuid: string, items: Array<{
    id: string,
    amount: number,
    display_name?: string,
    lore?: string[]
  }>): Promise<any> {
    try {
      return await this.wingullPlayerService.giveItems(uuid, items);
    } catch (error) {
      console.error(`Error giving items to ${uuid}:`, error);
      throw new Error(`Failed to give items: ${error.message}`);
    }
  }

  async getBattleTeams(uuid: string): Promise<any> {
    try {
      const data = await this.wingullPlayerService.getBattleTeams(uuid);
      
      // The battleteam is already an array of pokemon, wrap it as a single team
      if (data && data.battleteam) {
        const pokemon = Array.isArray(data.battleteam) ? data.battleteam : [data.battleteam];
        
        return {
          teams: [
            {
              id: 1,
              name: "battleteam",
              pokemon: pokemon
            }
          ],
          maxTeams: 5,
          activeTeamId: -1
        };
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting battle teams for ${uuid}:`, error);
      throw new Error(`Failed to get battle teams: ${error.message}`);
    }
  }

  async updateBattleTeam(updateBattleTeamDto: UpdateBattleTeamDto): Promise<any> {
    try {
      return await this.wingullPlayerService.updateBattleTeam(updateBattleTeamDto);
    } catch (error) {
      console.error('Error updating battle team:', error);
      throw new Error(`Failed to update battle team: ${error.message}`);
    }
  }
  
  // ==================== WORLD OPERATIONS ====================
  
  async getPerformance(): Promise<any> {
    try {
      return await this.wingullWorldService.getPerformance();
    } catch (error) {
      console.error('Error getting performance data:', error);
      throw new Error(`Failed to get performance data: ${error.message}`);
    }
  }
  
  async getRegions(): Promise<any> {
    try {
      return await this.wingullWorldService.getRegions();
    } catch (error) {
      console.error('Error getting regions data:', error);
      throw new Error(`Failed to get regions data: ${error.message}`);
    }
  }
  
  async getWeather(): Promise<any> {
    try {
      return await this.wingullWorldService.getWeather();
    } catch (error) {
      console.error('Error getting weather data:', error);
      throw new Error(`Failed to get weather data: ${error.message}`);
    }
  }
  
  async updateNPCs(data: any): Promise<any> {
    try {
      return await this.wingullWorldService.updateNPCs(data);
    } catch (error) {
      console.error('Error updating NPCs:', error);
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
    } catch (error) {
      console.error('Error getting taxi stops:', error);
      throw new Error(`Failed to get taxi stops: ${error.message}`);
    }
  }
  
  async teleportPlayer(id: string, uuid: string): Promise<boolean> {
    try {
      return await this.wingullTransportService.teleportPlayer(id, uuid);
    } catch (error) {
      console.error(`Error teleporting player ${uuid} to ${id}:`, error);
      throw new Error(`Failed to teleport player: ${error.message}`);
    }
  }

  async getPlayersOwnedRegions(uuid: string): Promise<{ region_id: string; world_id: number; owner: boolean; name: string; uuid: string }[]> {
    return await this.wingullRepository.getPlayersOwnedRegions(uuid);
  }

  async getAllPlots(): Promise<any[]> {
    return await this.wingullRepository.getAllPlots();
  }
}