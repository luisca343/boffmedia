import { Injectable } from '@nestjs/common';
import { BattleRepository } from '@repositories/smartrotom/battle.repository';
import {
  BattleReplayResponse,
  ReplayData,
  UserReplayData,
  ReplayUpdateData
} from '../types/battle.types';

@Injectable()
export class ReplayService {
  constructor(
    private readonly battleRepository: BattleRepository,
  ) {}

  async getUserReplays(uuid: string): Promise<BattleReplayResponse[]> {
    if (!uuid) {
      throw new Error('UUID is required');
    }

    return this.battleRepository.findReplaysByUser(uuid);
  }

  async getReplayById(replayId: number): Promise<BattleReplayResponse> {
    if (!replayId || replayId <= 0) {
      throw new Error('Valid replay ID is required');
    }

    const replay = await this.battleRepository.findReplayById(replayId);
    
    if (!replay) {
      throw new Error('Replay not found');
    }

    return replay;
  }

  async createReplay(replayData: ReplayData): Promise<BattleReplayResponse> {
    const result = await this.battleRepository.createReplay(replayData);
    return this.getReplayById(result.insertId);
  }

  async associateReplayWithUser(uuid: string, replayId: number, side?: number): Promise<void> {
    // Check if replay exists
    const replay = await this.battleRepository.findReplayById(replayId);
    if (!replay) {
      throw new Error('Replay not found');
    }

    // Check if association already exists
    const existingAssociation = await this.battleRepository.findUserReplayByIds(uuid, replayId);
    if (existingAssociation) {
      throw new Error('User is already associated with this replay');
    }

    const userReplayData: UserReplayData = {
      uuid,
      replayId,
      side: side || 1
    };

    await this.battleRepository.createUserReplay(userReplayData);
  }

  async updateReplay(replayId: number, replayData: ReplayUpdateData): Promise<BattleReplayResponse> {
    const existingReplay = await this.battleRepository.findReplayById(replayId);
    if (!existingReplay) {
      throw new Error('Replay not found');
    }

    await this.battleRepository.updateReplay(replayId, replayData);
    return this.getReplayById(replayId);
  }

  async deleteReplay(replayId: number): Promise<void> {
    const existingReplay = await this.battleRepository.findReplayById(replayId);
    if (!existingReplay) {
      throw new Error('Replay not found');
    }

    await this.battleRepository.deleteReplay(replayId);
  }

  async removeUserFromReplay(uuid: string, replayId: number): Promise<void> {
    const existingAssociation = await this.battleRepository.findUserReplayByIds(uuid, replayId);
    if (!existingAssociation) {
      throw new Error('User is not associated with this replay');
    }

    await this.battleRepository.deleteUserReplay(uuid, replayId);
  }

  async validateReplayAccess(uuid: string, replayId: number): Promise<boolean> {
    const association = await this.battleRepository.findUserReplayByIds(uuid, replayId);
    return !!association;
  }
}