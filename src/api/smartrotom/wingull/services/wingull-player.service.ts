import { Injectable } from '@nestjs/common';
import { WingullRepository, MessageRequest, PokemonGiveRequest } from '@api/smartrotom/wingull/repositories/wingull.repository';

@Injectable()
export class WingullPlayerService {
  constructor(
    private readonly wingullRepository: WingullRepository,
  ) {}
  
  async getStats(uuid: string): Promise<any> {
    try {
      return await this.wingullRepository.getStatsFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get stats for ${uuid}:`, error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }
  
  async getTeam(uuid: string): Promise<any> {
    try {
      return await this.wingullRepository.getTeamFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get team for ${uuid}:`, error);
      throw new Error(`Team retrieval failed: ${error.message}`);
    }
  }
  
  async updateDex(uuid: string): Promise<any> {
    try {
      return await this.wingullRepository.updateDexInAPI(uuid);
    } catch (error) {
      console.error(`Failed to update dex for ${uuid}:`, error);
      throw new Error(`Dex update failed: ${error.message}`);
    }
  }
  
  async getQuests(uuid: string): Promise<any> {
    try {
      return await this.wingullRepository.getQuestsFromAPI(uuid);
    } catch (error) {
      console.error(`Failed to get quests for ${uuid}:`, error);
      throw new Error(`Quests retrieval failed: ${error.message}`);
    }
  }
  
  async sendMessage(uuid: string, message: string): Promise<any> {
    try {
      const request: MessageRequest = { uuid, message };
      return await this.wingullRepository.sendMessageInAPI(request);
    } catch (error) {
      console.error(`Failed to send message to ${uuid}:`, error);
      throw new Error(`Message sending failed: ${error.message}`);
    }
  }
  
  async givePokemon(uuid: string, pokespec: string, sendMessage: boolean = true): Promise<any> {
    try {
      const request: PokemonGiveRequest = { uuid, pokespec, sendMessage };
      return await this.wingullRepository.givePokemonInAPI(request);
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
      return await this.wingullRepository.giveItemsInAPI(uuid, items);
    } catch (error) {
      console.error(`Failed to give items to ${uuid}:`, error);
      throw new Error(`Items giving failed: ${error.message}`);
    }
  }
}