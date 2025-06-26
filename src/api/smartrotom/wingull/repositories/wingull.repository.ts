import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

export interface WingullBalance {
  balance: number;
  type: string;
  uuid: string;
}

export interface TeleportRequest {
  id: string;
  uuid: string;
}

export interface PokemonGiveRequest {
  uuid: string;
  pokespec: string;
  sendMessage?: boolean;
}

export interface MessageRequest {
  uuid: string;
  message: string;
}

@Injectable()
export class WingullRepository {
  private readonly WINGULL_API_BASE_URL = process.env.WINGULL_API;
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  
  // ==================== ECONOMY OPERATIONS ====================
  
  async updateBalanceInAPI(balanceData: WingullBalance): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/updateBalance`,
        balanceData,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to update balance in WINGULL API:', error);
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }
  
  async getCurrentBalanceFromAPI(uuid: string, amount?: number): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting current balance');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/getCurrentBalance`,
        { uuid, amount },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get current balance for UUID ${uuid}:`, error);
      throw new Error(`Current balance retrieval failed: ${error.message}`);
    }
  }
  
  async getMoneyFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting money');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/money`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get money for UUID ${uuid}:`, error);
      throw new Error(`Money retrieval failed: ${error.message}`);
    }
  }
  
  // ==================== PLAYER OPERATIONS ====================
  
  async getStatsFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting stats');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/stats`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get stats for UUID ${uuid}:`, error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }
  
  async getTeamFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting team');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/equipo`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get team for UUID ${uuid}:`, error);
      throw new Error(`Team retrieval failed: ${error.message}`);
    }
  }
  
  async updateDexInAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for updating dex');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/updateDex`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to update dex for UUID ${uuid}:`, error);
      throw new Error(`Dex update failed: ${error.message}`);
    }
  }
  
  async getQuestsFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting quests');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/quests`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get quests for UUID ${uuid}:`, error);
      throw new Error(`Quests retrieval failed: ${error.message}`);
    }
  }
  
  async sendMessageInAPI(request: MessageRequest): Promise<any> {
    if (!request.uuid || request.uuid.trim() === '') {
      throw new Error('UUID is required for sending message');
    }
    
    if (!request.message || request.message.trim() === '') {
      throw new Error('Message is required');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/message`,
        request,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to send message to UUID ${request.uuid}:`, error);
      throw new Error(`Message sending failed: ${error.message}`);
    }
  }
  
  async givePokemonInAPI(request: PokemonGiveRequest): Promise<any> {
    if (!request.uuid || request.uuid.trim() === '') {
      throw new Error('UUID is required for giving Pokémon');
    }
    
    if (!request.pokespec || request.pokespec.trim() === '') {
      throw new Error('Pokespec is required for giving Pokémon');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/givePokemon`,
        request,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to give Pokémon to UUID ${request.uuid}:`, error);
      throw new Error(`Pokémon giving failed: ${error.message}`);
    }
  }
  
  async giveItemsInAPI(uuid: string, items: Array<{
    id: string,
    amount: number,
    display_name?: string,
    lore?: string[]
  }>): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for giving items');
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required and cannot be empty');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/giveitems`,
        { uuid, items },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to give items to UUID ${uuid}:`, error);
      throw new Error(`Items giving failed: ${error.message}`);
    }
  }
  
  // ==================== WORLD OPERATIONS ====================
  
  async getPerformanceFromAPI(): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.WINGULL_API_BASE_URL}/performance`,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get performance data:', error);
      throw new Error(`Performance data retrieval failed: ${error.message}`);
    }
  }
  
  async getRegionsFromAPI(townColors?: any): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const url = townColors 
      ? `${this.WINGULL_API_BASE_URL}/regions`
      : `${this.WINGULL_API_BASE_URL}/regions`;
      
      const response: AxiosResponse = await axios.get(url, {
        timeout: this.DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // If townColors are provided, merge them with the response
      if (townColors && response.data) {
        return this.mergeRegionsWithColors(response.data, townColors);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to get regions data:', error);
      throw new Error(`Regions data retrieval failed: ${error.message}`);
    }
  }
  
  async getWeatherFromAPI(): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.WINGULL_API_BASE_URL}/weather`,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get weather data:', error);
      throw new Error(`Weather data retrieval failed: ${error.message}`);
    }
  }
  
  async updateNPCsInAPI(data: any): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/updateNPCs`,
        data,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to update NPCs:', error);
      throw new Error(`NPCs update failed: ${error.message}`);
    }
  }
  
  // ==================== TRANSPORTATION OPERATIONS ====================
  
  async getTaxiStopsFromAPI(): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.get(
        `${this.WINGULL_API_BASE_URL}/taxi/stops`,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get taxi stops:', error);
      throw new Error(`Taxi stops retrieval failed: ${error.message}`);
    }
  }
  
  async teleportPlayerInAPI(request: TeleportRequest): Promise<any> {
    if (!request.id || request.id.trim() === '') {
      throw new Error('Stop ID is required for teleportation');
    }
    
    if (!request.uuid || request.uuid.trim() === '') {
      throw new Error('UUID is required for teleportation');
    }
    
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/taxi/teleport`,
        request,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to teleport player ${request.uuid} to stop ${request.id}:`, error);
      throw new Error(`Player teleportation failed: ${error.message}`);
    }
  }
  
  // ==================== UTILITY METHODS ====================
  
  private mergeRegionsWithColors(regionsData: any, townColors: any): any {
    // Implementation to merge regions data with town colors
    if (!regionsData || !townColors) {
      return regionsData;
    }
    
    // This would depend on the actual structure of regionsData
    // For now, just return the original data with colors attached
    return {
      ...regionsData,
      townColors
    };
  }
}