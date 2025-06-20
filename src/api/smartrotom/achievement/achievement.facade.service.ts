import { Injectable } from '@nestjs/common';
import { AchievementsService } from './services/achievements.service';
import { ReplaysService } from './services/replays.service';
import { BattleAchievementService, BattleAchievementRequest } from './services/battle-achievement.service';

@Injectable()
export class AchievementFacadeService {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly replaysService: ReplaysService,
    private readonly battleAchievementService: BattleAchievementService,
  ) {}

  // ==================== ACHIEVEMENT MANAGEMENT ====================

  async getUserAchievements(uuid: string): Promise<any[]> {
    return this.achievementsService.getUserAchievements(uuid);
  }

  async getUserAchievementById(uuid: string, achievementId: string): Promise<any> {
    return this.achievementsService.getUserAchievementById(uuid, achievementId);
  }

  async checkUserHasAchievement(uuid: string, achievementId: string): Promise<{ completed: number | null; error?: string }> {
    return this.achievementsService.checkUserHasAchievement(uuid, achievementId);
  }

  // ==================== REPLAY MANAGEMENT ====================

  async createReplay(replayData: {
    side1: string;
    side2: string;
    team1: string;
    team2: string;
    replay: string;
    winner: string;
  }): Promise<{ replayId: number }> {
    return this.replaysService.createReplay(replayData);
  }

  async createUserReplay(uuid: string, replayId: number): Promise<{ insertId: number }> {
    return this.replaysService.createUserReplay(uuid, replayId);
  }

  async getUserReplay(uuid: string, replayId: number): Promise<any> {
    return this.replaysService.getUserReplay(uuid, replayId);
  }

  // ==================== BATTLE ACHIEVEMENT PROCESSING ====================

  async processBattleAchievement(battleData: BattleAchievementRequest): Promise<{ success: boolean; message: string }> {
    return this.battleAchievementService.processBattleAchievement(battleData);
  }

  // ==================== LEGACY METHODS (for backwards compatibility) ====================

  async unlockAchievement(uuid: string, logro: string): Promise<{ success: boolean; message: string }> {
    // Simple achievement unlock without battle data
    const achievementData = {
      uuid,
      achievementId: logro,
      progress: 1,
      completed: 1,
      completedAt: new Date().toISOString()
    };

    try {
      await this.achievementsService.createUserAchievement(achievementData);
      return { success: true, message: 'Achievement unlocked successfully' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to unlock achievement' };
    }
  }
}