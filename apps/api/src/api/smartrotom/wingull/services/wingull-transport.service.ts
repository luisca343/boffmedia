import { Inject, Injectable } from '@nestjs/common';
import { TeleportRequestDto } from '../dto/teleport-request.dto';
import { WINGULL_TRANSPORT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IWingullTransportRepository } from '../repositories/interfaces/wingull-transport.repository.interface';
import { TaxiStop } from '../entities/taxi-stop.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullTransportService {
  constructor(
    private readonly logger: Logger,

    @Inject(WINGULL_TRANSPORT_REPOSITORY_TOKEN)
    private readonly wingullTransportRepository: IWingullTransportRepository,
  ) {}

  async getTaxiStops(): Promise<TaxiStop[]> {
    try {
      return await this.wingullTransportRepository.getTaxiStopsFromAPI();
    } catch (error: any) {
      this.logger.error('Failed to get taxi stops:', error);
      throw new Error(`Taxi stops retrieval failed: ${error.message}`);
    }
  }

  async teleportPlayer(id: string, uuid: string): Promise<boolean> {
    try {
      const request: TeleportRequestDto = { id, uuid };
      const result =
        await this.wingullTransportRepository.teleportPlayerInAPI(request);
      return !!result; // Convert to boolean
    } catch (error: any) {
      this.logger.error(`Failed to teleport player ${uuid} to ${id}:`, error);
      throw new Error(`Player teleportation failed: ${error.message}`);
    }
  }
}
