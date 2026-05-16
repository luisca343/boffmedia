import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IReplaysRepository } from '../repositories/interfaces/achievements.replays.repository.interface';
import { REPLAYS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';
import { Replay } from '../entities/replay.entity';
import { UserReplayEntity } from '../entities/user-replay.entity';
import { CreateReplayFullDto } from '../dto/create-replay-full.dto';

@Injectable()
export class ReplaysService {
  constructor(
    @Inject(REPLAYS_REPOSITORY_TOKEN)
    private readonly replaysRepository: IReplaysRepository,
  ) {}

  async createReplay(
    replayData: CreateReplayFullDto,
  ): Promise<BaseInsertResponse> {
    this.validateReplayData(replayData);

    const replay = await this.replaysRepository.create(replayData);
    return { insertId: replay.id };
  }

  async createUserReplay(
    uuid: string,
    replayId: number,
  ): Promise<BaseInsertResponse> {
    this.validateUuid(uuid);
    this.validateReplayId(replayId);

    const userReplayData: UserReplayEntity = {
      uuid,
      replayId,
      side: 1, // Default to side 1, could be parameterized later
    };

    return this.replaysRepository.createUserReplay(userReplayData);
  }

  async getUserReplay(uuid: string, replayId: number): Promise<Replay | null> {
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

  private validateReplayData(replayData: CreateReplayFullDto): void {
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
