import { Injectable } from '@nestjs/common';
import { WingullRepository, TeleportRequest } from '@repositories/smartrotom/wingull.repository';

@Injectable()
export class WingullTransportService {
  constructor(
    private readonly wingullRepository: WingullRepository,
  ) {}

  async getTaxiStops(): Promise<any> {
    try {
      return await this.wingullRepository.getTaxiStopsFromAPI();
    } catch (error) {
      console.error('Failed to get taxi stops:', error);
      throw new Error(`Taxi stops retrieval failed: ${error.message}`);
    }
  }

  async teleportPlayer(id: string, uuid: string): Promise<boolean> {
    try {
      const request: TeleportRequest = { id, uuid };
      const result = await this.wingullRepository.teleportPlayerInAPI(request);
      return !!result; // Convert to boolean
    } catch (error) {
      console.error(`Failed to teleport player ${uuid} to ${id}:`, error);
      throw new Error(`Player teleportation failed: ${error.message}`);
    }
  }
}