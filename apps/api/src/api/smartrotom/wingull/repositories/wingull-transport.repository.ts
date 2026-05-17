import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { TeleportRequestDto } from '../dto/teleport-request.dto';
import { IWingullTransportRepository } from './interfaces/wingull-transport.repository.interface';
import { TaxiStop } from '../entities/taxi-stop.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullTransportRepository implements IWingullTransportRepository {
  constructor(private readonly logger: Logger) {}

  private readonly WINGULL_API_BASE_URL = process.env.WINGULL_API;
  private readonly DEFAULT_TIMEOUT = 10000;

  async getTaxiStopsFromAPI(): Promise<TaxiStop[]> {
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get taxi stops:', error);
      throw new Error(`Taxi stops retrieval failed: ${error.message}`);
    }
  }

  async teleportPlayerInAPI(request: TeleportRequestDto): Promise<any> {
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
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to teleport player ${request.uuid} to stop ${request.id}:`,
        error,
      );
      throw new Error(`Player teleportation failed: ${error.message}`);
    }
  }
}
