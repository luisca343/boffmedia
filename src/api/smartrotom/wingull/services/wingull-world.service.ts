import { Inject, Injectable } from '@nestjs/common';
import { IWingullWorldRepository } from '../repositories/interfaces/wingull-world.repository.interface';
import { WINGULL_WORLD_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { Performance } from '../entities/performance.entity';
import { Region } from '../entities/region.entity';
import { Weather } from '../entities/weather.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

@Injectable()
export class WingullWorldService {
  constructor(
    @Inject(WINGULL_WORLD_REPOSITORY_TOKEN)
    private readonly wingullWorldRepository: IWingullWorldRepository,
  ) {}

  async getPerformance(): Promise<Performance> {
    try {
      return await this.wingullWorldRepository.getPerformanceFromAPI();
    } catch (error) {
      console.error('Failed to get performance data:', error);
      throw new Error(`Performance data retrieval failed: ${error.message}`);
    }
  }

  async getRegions(): Promise<Region[]> {
    try {
      return await this.wingullWorldRepository.getRegionsFromAPI();
    } catch (error) {
      console.error('Failed to get regions data:', error);
      throw new Error(`Regions data retrieval failed: ${error.message}`);
    }
  }

  async getWeather(): Promise<Weather> {
    try {
      return await this.wingullWorldRepository.getWeatherFromAPI();
    } catch (error) {
      console.error('Failed to get weather data:', error);
      throw new Error(`Weather data retrieval failed: ${error.message}`);
    }
  }

  async updateNPCs(data: any): Promise<SuccessResponse> {
    try {
      return await this.wingullWorldRepository.updateNPCsInAPI(data);
    } catch (error) {
      console.error('Failed to update NPCs:', error);
      throw new Error(`NPCs update failed: ${error.message}`);
    }
  }
}