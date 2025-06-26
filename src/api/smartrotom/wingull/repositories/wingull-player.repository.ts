import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { IWingullPlayerRepository } from './interfaces/wingull-player.repository.interface';
import { PokemonGiveRequestDto } from '../dto/pokemon-give-request.dto';
import { MessageRequestDto } from '../dto/message-request.dto';
import { PlayerStats } from '../entities/player-stats.entity';
import { Pokemon } from '../entities/pokemon.entity';

@Injectable()
export class WingullPlayerRepository implements IWingullPlayerRepository {
  private readonly WINGULL_API_BASE_URL = process.env.WINGULL_API;
  private readonly DEFAULT_TIMEOUT = 10000;

  async getStatsFromAPI(uuid: string): Promise<PlayerStats> {
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
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get stats for UUID ${uuid}:`, error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }

  async getTeamFromAPI(uuid: string): Promise<Pokemon[]> {
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
      return response.data.data;
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
      return response.data.data;
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
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get quests for UUID ${uuid}:`, error);
      throw new Error(`Quests retrieval failed: ${error.message}`);
    }
  }

  async sendMessageInAPI(request: MessageRequestDto): Promise<any> {
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
      return response.data.data;
    } catch (error) {
      console.error(`Failed to send message to UUID ${request.uuid}:`, error);
      throw new Error(`Message sending failed: ${error.message}`);
    }
  }

  async givePokemonInAPI(request: PokemonGiveRequestDto): Promise<any> {
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
      return response.data.data;
    } catch (error) {
      console.error(`Failed to give Pokémon to UUID ${request.uuid}:`, error);
      throw new Error(`Pokémon giving failed: ${error.message}`);
    }
  }

  async giveItemsInAPI(uuid: string, items: Array<{ id: string, amount: number, display_name?: string, lore?: string[] }>): Promise<any> {
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
      return response.data.data;
    } catch (error) {
      console.error(`Failed to give items to UUID ${uuid}:`, error);
      throw new Error(`Items giving failed: ${error.message}`);
    }
  }
}
