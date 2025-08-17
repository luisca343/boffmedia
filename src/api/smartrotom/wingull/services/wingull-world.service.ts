import * as fs from 'fs';
import * as path from 'path';
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

  async getAllTowns(): Promise<string[]> {
    try {
      const pueblosPath = path.join(process.cwd(), 'public/smartrotom/data/pueblos');
      
      if (!fs.existsSync(pueblosPath)) {
        throw new Error('Towns directory does not exist.');
      }

      const towns = fs.readdirSync(pueblosPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      return towns;
    } catch (error) {
      console.error('Failed to fetch all towns:', error);
      throw new Error(`Could not fetch towns list: ${error.message}`);
    }
  }

  async getTownInfo(townName: string): Promise<any> {
    try {
      // Get all towns to validate if the requested town exists
      const allTowns = await this.getAllTowns();
      
      if (!allTowns.includes(townName)) {
        throw new Error(`Town '${townName}' not found. Available towns: ${allTowns.join(', ')}`);
      }

      const townPath = path.join(process.cwd(), 'public/smartrotom/data/pueblos', townName);
      const textosPath = path.join(townPath, 'textos.json');

      if (!fs.existsSync(townPath)) {
        throw new Error(`Town folder for ${townName} does not exist.`);
      }

      const textos = JSON.parse(fs.readFileSync(textosPath, 'utf-8'));
      const images = fs.readdirSync(townPath).filter(file => file !== 'textos.json' && file !== 'fondo.webp');

      return {
        textos,
        fondo: `/smartrotom/data/pueblos/${townName}/fondo.webp`,
        images: images.map(image => `/smartrotom/data/pueblos/${townName}/${image}`),
      };
    } catch (error) {
      console.error(`Failed to fetch town info for ${townName}:`, error);
      throw new Error(`Could not fetch town info for ${townName}: ${error.message}`);
    }
  }
}