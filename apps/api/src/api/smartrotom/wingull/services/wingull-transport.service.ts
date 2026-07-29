import { Inject, Injectable } from '@nestjs/common';
import { TeleportRequestDto } from '../dto/teleport-request.dto';
import { WINGULL_TRANSPORT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IWingullTransportRepository } from '../repositories/interfaces/wingull-transport.repository.interface';
import { TaxiStop } from '../entities/taxi-stop.entity';
import { PlayerPosition } from '../entities/player-position.entity';
import { TeleportOutcome } from '../entities/teleport-outcome.entity';
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

  /**
   * Where a player is standing. An offline player is a normal answer (`online: false`), not an
   * error — the taxi refuses the trip on it rather than failing.
   */
  async getPlayerPosition(uuid: string): Promise<PlayerPosition> {
    try {
      return await this.wingullTransportRepository.getPlayerPositionFromAPI(
        uuid,
      );
    } catch (error: any) {
      this.logger.error(`Failed to read the position of ${uuid}:`, error);
      throw new Error(`Player position read failed: ${error.message}`);
    }
  }

  /**
   * Moves a player to a stop, answering *why* if it did not happen.
   *
   * The outcome is passed through untouched: the taxi charges a fare on it, and collapsing
   * "the player is offline, nothing happened" into the same value as "the server did not
   * answer, so it may or may not have happened" is exactly the distinction that decides
   * whether a player pays.
   */
  async teleportPlayer(id: string, uuid: string): Promise<TeleportOutcome> {
    const request: TeleportRequestDto = { id, uuid };
    return this.wingullTransportRepository.teleportPlayerInAPI(request);
  }
}
