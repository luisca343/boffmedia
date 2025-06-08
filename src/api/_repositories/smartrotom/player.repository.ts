import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class PlayerRepository {
  private readonly WINGULL_API_BASE_URL = process.env.WINGULL_API;
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  // TODO: Add type definitions for the return types of these methods
  async fetchPlayerStatsFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for fetching player stats');
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
      console.error(`Failed to fetch player stats for UUID ${uuid}:`, error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Wingull API request timed out');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Player not found in Wingull API');
      }
      
      throw new Error(`Wingull API stats request failed: ${error.message}`);
    }
  }

  async fetchPlayerTeamFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for fetching player team');
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
      console.error(`Failed to fetch player team for UUID ${uuid}:`, error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Wingull API request timed out');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Player team not found in Wingull API');
      }
      
      throw new Error(`Wingull API team request failed: ${error.message}`);
    }
  }
}