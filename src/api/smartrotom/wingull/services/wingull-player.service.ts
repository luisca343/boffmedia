import { Inject, Injectable } from '@nestjs/common';
import { MessageRequestDto } from '../dto/message-request.dto';
import { PokemonGiveRequestDto } from '../dto/pokemon-give-request.dto';
import { UpdateBattleTeamDto } from '../dto/battle-team.dto';
import { WINGULL_USER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IWingullPlayerRepository } from '../repositories/interfaces/wingull-player.repository.interface';
import { PlayerStats } from '../entities/player-stats.entity';
import { PokemonW } from '../entities/pokemon-w-.entity';

@Injectable()
export class WingullPlayerService {
  constructor(
    @Inject(WINGULL_USER_REPOSITORY_TOKEN)
    private readonly wingullPlayerRepository: IWingullPlayerRepository,
  ) {}
  
  async getStats(uuid: string): Promise<PlayerStats> {
    try {
      return await this.wingullPlayerRepository.getStatsFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get stats for ${uuid}:`, error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }
  
  async getTeam(uuid: string): Promise<PokemonW[]> {
    try {
      return await this.wingullPlayerRepository.getTeamFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get team for ${uuid}:`, error);
      throw new Error(`Team retrieval failed: ${error.message}`);
    }
  }

  async getPC(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.getPCFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get PC for ${uuid}:`, error);
      throw new Error(`PC retrieval failed: ${error.message}`);
    }
  }

  async movePokemon(movePokemonDto: any): Promise<any> {
    try {
      return await this.wingullPlayerRepository.movePokemonInAPI(movePokemonDto);
    } catch (error) {
      console.error(`Failed to move Pokémon:`, error);
      throw new Error(`Pokémon move failed: ${error.message}`);
    }
  }

  async updateDex(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.updateDexInAPI(uuid);
    } catch (error) {
      console.error(`Failed to update dex for ${uuid}:`, error);
      throw new Error(`Dex update failed: ${error.message}`);
    }
  }
  
  async getQuests(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.getQuestsFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get quests for ${uuid}:`, error);
      throw new Error(`Quests retrieval failed: ${error.message}`);
    }
  }
  
  async sendMessage(uuid: string, message: string): Promise<any> {
    try {
      const request: MessageRequestDto = { uuid, message };
      return await this.wingullPlayerRepository.sendMessageInAPI(request);
    } catch (error) {
      console.error(`Failed to send message to ${uuid}:`, error);
      throw new Error(`Message sending failed: ${error.message}`);
    }
  }
  
  async givePokemon(uuid: string, pokespec: string, sendMessage: boolean = true): Promise<any> {
    try {
      const request: PokemonGiveRequestDto = { uuid, pokespec, sendMessage };
      return await this.wingullPlayerRepository.givePokemonInAPI(request);
    } catch (error) {
      console.error(`Failed to give Pokémon to ${uuid}:`, error);
      throw new Error(`Pokémon giving failed: ${error.message}`);
    }
  }
  
  async giveItems(uuid: string, items: Array<{
    id: string,
    amount: number,
    display_name?: string,
    lore?: string[]
  }>): Promise<any> {
    try {
      return await this.wingullPlayerRepository.giveItemsInAPI(uuid, items);
    } catch (error) {
      console.error(`Failed to give items to ${uuid}:`, error);
      throw new Error(`Items giving failed: ${error.message}`);
    }
  }

  async getBattleTeams(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.getBattleTeamsFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get battle teams for ${uuid}:`, error);
      throw new Error(`Battle teams retrieval failed: ${error.message}`);
    }
  }

  async updateBattleTeam(updateBattleTeamDto: UpdateBattleTeamDto): Promise<any> {
    try {
      return await this.wingullPlayerRepository.updateBattleTeamInAPI(updateBattleTeamDto);
    } catch (error) {
      console.error('Failed to update battle team:', error);
      throw new Error(`Battle team update failed: ${error.message}`);
    }
  }
}