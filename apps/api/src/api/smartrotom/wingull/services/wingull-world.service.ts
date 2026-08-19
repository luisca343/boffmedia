import * as fs from 'fs';
import * as path from 'path';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { IWingullWorldRepository } from '../repositories/interfaces/wingull-world.repository.interface';
import { WINGULL_WORLD_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { Performance } from '../entities/performance.entity';
import { Region } from '../entities/region.entity';
import { Weather } from '../entities/weather.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullWorldService {
  constructor(
    private readonly logger: Logger,

    @Inject(WINGULL_WORLD_REPOSITORY_TOKEN)
    private readonly wingullWorldRepository: IWingullWorldRepository,
  ) {}

  async getPerformance(): Promise<Performance> {
    try {
      return await this.wingullWorldRepository.getPerformanceFromAPI();
    } catch (error: any) {
      this.logger.error('Failed to get performance data:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Performance data retrieval failed: ${error.message}`);
    }
  }

  async getRegions(): Promise<Region[]> {
    try {
      return await this.wingullWorldRepository.getRegionsFromAPI();
    } catch (error: any) {
      this.logger.error('Failed to get regions data:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Regions data retrieval failed: ${error.message}`);
    }
  }

  async getWeather(): Promise<Weather> {
    try {
      return await this.wingullWorldRepository.getWeatherFromAPI();
    } catch (error: any) {
      this.logger.error('Failed to get weather data:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Weather data retrieval failed: ${error.message}`);
    }
  }

  async updateNPCs(data: any): Promise<SuccessResponse> {
    try {
      return await this.wingullWorldRepository.updateNPCsInAPI(data);
    } catch (error: any) {
      this.logger.error('Failed to update NPCs:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`NPCs update failed: ${error.message}`);
    }
  }

  async getAllTowns(): Promise<string[]> {
    try {
      const pueblosPath = path.join(
        process.cwd(),
        'public/smartrotom/data/pueblos',
      );

      if (!fs.existsSync(pueblosPath)) {
        throw new Error('Towns directory does not exist.');
      }

      const towns = fs
        .readdirSync(pueblosPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      return towns;
    } catch (error: any) {
      this.logger.error('Failed to fetch all towns:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Could not fetch towns list: ${error.message}`);
    }
  }

  async getTownInfo(townName: string): Promise<any> {
    try {
      // Get all towns to validate if the requested town exists
      const allTowns = await this.getAllTowns();

      if (!allTowns.includes(townName)) {
        throw new Error(
          `Town '${townName}' not found. Available towns: ${allTowns.join(', ')}`,
        );
      }

      const townPath = path.join(
        process.cwd(),
        'public/smartrotom/data/pueblos',
        townName,
      );
      const textosPath = path.join(townPath, 'config.json');

      if (!fs.existsSync(townPath)) {
        throw new Error(`Town folder for ${townName} does not exist.`);
      }

      const textos = JSON.parse(fs.readFileSync(textosPath, 'utf-8'));
      const images = fs
        .readdirSync(townPath)
        .filter((file) => file !== 'config.json' && file !== 'fondo.webp');

      return {
        textos,
        fondo: `/smartrotom/data/pueblos/${townName}/fondo.webp`,
        images: images.map(
          (image) => `/smartrotom/data/pueblos/${townName}/${image}`,
        ),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch town info for ${townName}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(
        `Could not fetch town info for ${townName}: ${error.message}`,
      );
    }
  }
}
