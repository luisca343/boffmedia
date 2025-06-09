import { Injectable } from '@nestjs/common';
import { WingullRepository } from '@repositories/smartrotom/wingull.repository';

@Injectable()
export class WingullWorldService {
  constructor(
    private readonly wingullRepository: WingullRepository,
  ) {}

  async getPerformance(): Promise<any> {
    try {
      return await this.wingullRepository.getPerformanceFromAPI();
    } catch (error) {
      console.error('Failed to get performance data:', error);
      throw new Error(`Performance data retrieval failed: ${error.message}`);
    }
  }

  async getRegions(townColors?: any): Promise<any> {
    try {
      return await this.wingullRepository.getRegionsFromAPI(townColors);
    } catch (error) {
      console.error('Failed to get regions data:', error);
      throw new Error(`Regions data retrieval failed: ${error.message}`);
    }
  }

  async getWeather(): Promise<any> {
    try {
      return await this.wingullRepository.getWeatherFromAPI();
    } catch (error) {
      console.error('Failed to get weather data:', error);
      throw new Error(`Weather data retrieval failed: ${error.message}`);
    }
  }

  async updateNPCs(data: any): Promise<any> {
    try {
      return await this.wingullRepository.updateNPCsInAPI(data);
    } catch (error) {
      console.error('Failed to update NPCs:', error);
      throw new Error(`NPCs update failed: ${error.message}`);
    }
  }
}