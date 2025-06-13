import { Injectable } from '@nestjs/common';
import { AchievementRepository } from '@repositories/smartrotom/achievement.repository';
import {
  CreateReplayRequest,
  CreateReplayResponse,
  CreateUserReplayResponse,
  ReplayDetailsResponse
} from '../types/achievement.types';

@Injectable()
export class ReplayService {
  constructor(
    private readonly achievementRepository: AchievementRepository,
  ) {}

  async createReplay(replayData: CreateReplayRequest): Promise<CreateReplayResponse> {
    const { side1, side2, team1, team2, replay, winner } = replayData;

    if (!side1 || !side2 || !team1 || !team2 || !replay || !winner) {
      throw new Error('All replay data fields are required');
    }

    const result = await this.achievementRepository.createReplay({
      side1,
      side2,
      team1,
      team2,
      replay,
      winner
    });

    return { replayId: result.insertId };
  }

  async createUserReplay(replayId: number, uuid: string, side: number): Promise<CreateUserReplayResponse> {
    if (!replayId || replayId <= 0) {
      throw new Error('Valid replay ID is required');
    }

    if (!uuid) {
      throw new Error('UUID is required');
    }

    if (side === undefined || side === null) {
      throw new Error('Side is required');
    }

    const result = await this.achievementRepository.createUserReplay({
      replayId,
      uuid,
      side
    });

    return { relationId: result.insertId };
  }

  async getUserReplay(uuid: string, replayId: number): Promise<ReplayDetailsResponse> {
    if (!uuid) {
      throw new Error('UUID is required');
    }

    if (!replayId || replayId <= 0) {
      throw new Error('Valid replay ID is required');
    }

    const replay = await this.achievementRepository.findUserReplay(uuid, replayId);
    if (!replay) {
      throw new Error('Replay not found or user does not have access');
    }

    return replay;
  }
}