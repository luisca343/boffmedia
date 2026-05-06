import { Injectable } from '@nestjs/common';
import { AchievementsService } from './services/achievements.service';
import { ReplaysService } from './services/replays.service';
import { BattleAchievementService, BattleAchievementRequest } from './services/battle-achievement.service';
import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';
import { UserAchievement } from './entities/achievement.entity';
import { Replay } from './entities/replay.entity';
import { UserAchievementEntity } from './entities/user-achievement.entity';
import { CreateReplayFullDto } from './dto/create-replay-full.dto';

@Injectable()
export class AchievementFacadeService {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly replaysService: ReplaysService,
    private readonly battleAchievementService: BattleAchievementService,
  ) {}

  // ==================== ACHIEVEMENT MANAGEMENT ====================

  async getUserAchievements(uuid: string): Promise<UserAchievement[]> {
    return this.achievementsService.getUserAchievements(uuid);
  }

  async getUserAchievementById(uuid: string, achievementId: string): Promise<UserAchievement> {
    return this.achievementsService.getUserAchievementById(uuid, achievementId);
  }

  async checkUserHasAchievement(uuid: string, achievementId: string): Promise<{ completed: number | null; error?: string }> {
    return this.achievementsService.checkUserHasAchievement(uuid, achievementId);
  }

  // ==================== REPLAY MANAGEMENT ====================

  async createReplay(replayData: CreateReplayFullDto): Promise<BaseInsertResponse> {
    return this.replaysService.createReplay(replayData);
  }

  async createUserReplay(uuid: string, replayId: number): Promise<BaseInsertResponse> {
    return this.replaysService.createUserReplay(uuid, replayId);
  }

  async getUserReplay(uuid: string, replayId: number): Promise<Replay | null> {
    return this.replaysService.getUserReplay(uuid, replayId);
  }

  // ==================== BATTLE ACHIEVEMENT PROCESSING ====================

  async processBattleAchievement(battleData: BattleAchievementRequest): Promise<{ success: boolean; message: string }> {
    return this.battleAchievementService.processBattleAchievement(battleData);
  }

  // ==================== LEGACY METHODS (for backwards compatibility) ====================

  async unlockAchievement(uuid: string, logro: string): Promise<{ success: boolean; message: string }> {
    // Simple achievement unlock without battle data
    const achievementData: UserAchievementEntity = {
      uuid,
      achievementId: logro,
      progress: 1,
      completed: 1,
      completedAt: new Date(),
      dataId: null
    };

    try {
      await this.achievementsService.createUserAchievement(achievementData);
      return { success: true, message: 'Achievement unlocked successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to unlock achievement' };
    }
  }
}