import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { IWingullPlayerRepository } from './interfaces/wingull-player.repository.interface';
import { PokemonGiveRequestDto } from '../dto/pokemon-give-request.dto';
import { MessageRequestDto } from '../dto/message-request.dto';
import { UpdateBattleTeamDto } from '../dto/battle-team.dto';
import { PlayerStats } from '../entities/player-stats.entity';
import { PokemonW } from '../entities/pokemon-w-.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullPlayerRepository implements IWingullPlayerRepository {
  constructor(private readonly logger: Logger) {}

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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to get stats for UUID ${uuid}:`, error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }

  async getTeamFromAPI(uuid: string): Promise<PokemonW[]> {
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to get team for UUID ${uuid}:`, error);
      throw new Error(`Team retrieval failed: ${error.message}`);
    }
  }

  async getPCFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting PC');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/pc`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to get PC for UUID ${uuid}:`, error);
      throw new Error(`PC retrieval failed: ${error.message}`);
    }
  }

  async movePokemonInAPI(movePokemonDto: any): Promise<any> {
    if (!movePokemonDto || typeof movePokemonDto !== 'object') {
      throw new Error('Invalid move Pokémon request');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/pc/move`,
        movePokemonDto,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to move Pokémon:`, error);
      throw new Error(`Pokémon move failed: ${error.message}`);
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
        `${this.WINGULL_API_BASE_URL}/updatedex`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to update dex for UUID ${uuid}:`, error);
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to get quests for UUID ${uuid}:`, error);
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to send message to UUID ${request.uuid}:`,
        error,
      );
      throw new Error(`Message sending failed: ${error.message}`);
    }
  }

  async globalchatInAPI(request: MessageRequestDto): Promise<any> {
    if (!request.uuid || request.uuid.trim() === '') {
      throw new Error('UUID is required for sending global chat message');
    }
    if (!request.message || request.message.trim() === '') {
      throw new Error('Message is required');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/globalchat`,
        request,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to send global chat message for UUID ${request.uuid}:`,
        error,
      );
      throw new Error(`Global chat message sending failed: ${error.message}`);
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
        `${this.WINGULL_API_BASE_URL}/givepokemon`,
        request,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to give Pokémon to UUID ${request.uuid}:`,
        error,
      );
      throw new Error(`Pokémon giving failed: ${error.message}`);
    }
  }

  splitItemsForApi(
    items: Array<{
      id: string;
      amount: number;
      display_name?: string;
      lore?: string[];
    }>,
    maxAmount = 64,
  ) {
    const result: Array<{
      id: string;
      amount: number;
      display_name?: string;
      lore?: string[];
    }> = [];
    for (const item of items) {
      let remaining = item.amount;
      while (remaining > 0) {
        const batchAmount = Math.min(remaining, maxAmount);
        result.push({ ...item, amount: batchAmount });
        remaining -= batchAmount;
      }
    }
    return result;
  }

  async giveItemsInAPI(
    uuid: string,
    items: Array<{
      id: string;
      amount: number;
      display_name?: string;
      lore?: string[];
    }>,
  ): Promise<any> {
    const splitItems = this.splitItemsForApi(items, 64);
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
        { uuid, items: splitItems },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to give items to UUID ${uuid}:`, error);
      throw new Error(`Items giving failed: ${error.message}`);
    }
  }

  async getBattleTeamsFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting battle teams');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/getallbattleteams`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to get battle teams for UUID ${uuid}:`, error);
      throw new Error(`Battle teams retrieval failed: ${error.message}`);
    }
  }

  async updateBattleTeamInAPI(
    updateBattleTeamDto: UpdateBattleTeamDto,
  ): Promise<any> {
    if (!updateBattleTeamDto || typeof updateBattleTeamDto !== 'object') {
      throw new Error(
        'UpdateBattleTeamDto is required for updating battle team',
      );
    }
    if (!updateBattleTeamDto.uuid || updateBattleTeamDto.uuid.trim() === '') {
      throw new Error('UUID is required for updating battle team');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/updatebattleteam`,
        updateBattleTeamDto,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to update battle team for UUID ${updateBattleTeamDto.uuid}:`,
        error,
      );
      throw new Error(`Battle team update failed: ${error.message}`);
    }
  }
}
