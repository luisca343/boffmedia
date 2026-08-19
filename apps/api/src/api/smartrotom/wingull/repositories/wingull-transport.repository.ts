import { HttpException, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { TeleportRequestDto } from '../dto/teleport-request.dto';
import { IWingullTransportRepository } from './interfaces/wingull-transport.repository.interface';
import { TaxiStop } from '../entities/taxi-stop.entity';
import { PlayerPosition } from '../entities/player-position.entity';
import {
  TeleportOutcome,
  TeleportReason,
} from '../entities/teleport-outcome.entity';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';

@Injectable()
export class WingullTransportRepository implements IWingullTransportRepository {
  constructor(private readonly logger: Logger) {}

  private readonly WINGULL_API_BASE_URL = env.WINGULL_API;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Taxi stops retrieval failed: ${error.message}`);
    }
  }

  async getPlayerPositionFromAPI(uuid: string): Promise<PlayerPosition> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required to read a position');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    const response: AxiosResponse = await axios.post(
      `${this.WINGULL_API_BASE_URL}/position`,
      { uuid },
      {
        timeout: this.DEFAULT_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return response.data.data;
  }

  /**
   * Asks the mod to move a player, preserving *why* it refused.
   *
   * This deliberately does not throw on a refusal: a 422 and a 503 mean opposite things to the
   * caller deciding whether to charge a fare, and an exception collapses them into one.
   */
  async teleportPlayerInAPI(
    request: TeleportRequestDto,
  ): Promise<TeleportOutcome> {
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
      await axios.post(
        `${this.WINGULL_API_BASE_URL}/taxi/teleport`,
        { id: request.id, uuid: request.uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: { 'Content-Type': 'application/json' },
        },
      );
      return { ok: true };
    } catch (error: any) {
      const status: number | undefined = error?.response?.status;
      const body = error?.response?.data ?? {};
      const message: string =
        body?.message ?? error?.message ?? 'Teleport failed';
      const reason = this.reasonFor(status, body?.code);

      this.logger.error(
        `Teleport of ${request.uuid} to '${request.id}' refused (${status ?? 'no response'}, ${reason}): ${message}`,
      );
      return { ok: false, reason, status: status ?? 0, message };
    }
  }

  private reasonFor(
    status: number | undefined,
    code: string | undefined,
  ): TeleportReason {
    switch (status) {
      case 422:
        return 'offline';
      case 404:
        return 'unknown_stop';
      case 409:
        // The mod serves both "no safe arrival" and "player is in a dungeon run" as 409 and
        // tells them apart with `code`. Older jars send no code; unsafe arrival is the one that
        // predates the dungeon check, so it is the safer assumption.
        return code === 'in_dungeon_run' ? 'in_dungeon_run' : 'unsafe_arrival';
      case 401:
        return 'unauthorized';
      default:
        // 503, a timeout, or no response at all. The mod may have moved the player anyway.
        return 'unresolved';
    }
  }
}
