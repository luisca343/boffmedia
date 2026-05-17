import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { Weather } from '../entities/weather.entity';
import { IWingullWorldRepository } from './interfaces/wingull-world.repository.interface';
import { Performance } from '../entities/performance.entity';
import { Region } from '../entities/region.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullWorldRepository implements IWingullWorldRepository {
  constructor(private readonly logger: Logger) {}

  private readonly WINGULL_API_BASE_URL = process.env.WINGULL_API;
  private readonly DEFAULT_TIMEOUT = 10000;

  async getPerformanceFromAPI(): Promise<Performance> {
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get performance data:', error);
      throw new Error(`Performance data retrieval failed: ${error.message}`);
    }
  }

  async getRegionsFromAPI(townColors?: any): Promise<Region[]> {
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
        },
      });
      /*
      if (townColors && response.data) {
        return this.mergeRegionsWithColors(response.data.data, townColors);
      }*/
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get regions data:', error);
      throw new Error(`Regions data retrieval failed: ${error.message}`);
    }
  }

  async getWeatherFromAPI(): Promise<Weather> {
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
          },
        },
      );
      return response.data.data as Weather;
    } catch (error: any) {
      this.logger.error('Failed to get weather data:', error);
      throw new Error(`Weather data retrieval failed: ${error.message}`);
    }
  }

  async updateNPCsInAPI(data: any): Promise<SuccessResponse> {
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to update NPCs:', error);
      throw new Error(`NPCs update failed: ${error.message}`);
    }
  }

  private mergeRegionsWithColors(regionsData: any, townColors: any): any {
    if (!regionsData || !townColors) {
      return regionsData;
    }
    return {
      ...regionsData,
      townColors,
    };
  }
}
