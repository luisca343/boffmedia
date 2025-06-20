import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IReplaysRepository } from '../repositories/interfaces/achievements.replays.repository.interface';
import { REPLAYS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

export interface CreateReplayRequest {
  side1: string;
  side2: string;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
}

@Injectable()
export class ReplaysService {
  constructor(
    @Inject(REPLAYS_REPOSITORY_TOKEN)
    private readonly replaysRepository: IReplaysRepository,
  ) {}

  async createReplay(replayData: CreateReplayRequest): Promise<{ replayId: number }> {
    this.validateReplayData(replayData);

    const replay = await this.replaysRepository.create(replayData);
    return { replayId: replay.id };
  }

  async createUserReplay(uuid: string, replayId: number): Promise<{ insertId: number }> {
    this.validateUuid(uuid);
    this.validateReplayId(replayId);

    const userReplayData = {
      uuid,
      replayId
    };

    return this.replaysRepository.createUserReplay(userReplayData);
  }

  async getUserReplay(uuid: string, replayId: number): Promise<any> {
    this.validateUuid(uuid);
    this.validateReplayId(replayId);

    return this.replaysRepository.findUserReplay(uuid, replayId);
  }

  // ==================== VALIDATION METHODS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  private validateReplayId(replayId: number): void {
    if (!replayId || replayId <= 0) {
      throw new BadRequestException('Valid replay ID is required');
    }
  }

  private validateReplayData(replayData: CreateReplayRequest): void {
    if (!replayData.side1) {
      throw new BadRequestException('Player 1 name is required');
    }
    if (!replayData.side2) {
      throw new BadRequestException('Player 2 name is required');
    }
    if (!replayData.team1) {
      throw new BadRequestException('Player 1 team data is required');
    }
    if (!replayData.team2) {
      throw new BadRequestException('Player 2 team data is required');
    }
    if (!replayData.replay) {
      throw new BadRequestException('Replay data is required');
    }
    if (!replayData.winner) {
      throw new BadRequestException('Winner is required');
    }
  }
}