import { Injectable } from '@nestjs/common';
import { AchievementService } from './services/achievement.service';
import { ReplayService } from './services/replay.service';
import { BattleAchievementService, BattleAchievementRequest } from './services/battle-achievement.service';
import { AchievementDetails, ReplayDetails } from '@repositories/smartrotom/achievement.repository';

@Injectable()
export class AchievementFacadeService {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly replayService: ReplayService,
    private readonly battleAchievementService: BattleAchievementService,
  ) {}

  // ==================== ACHIEVEMENT MANAGEMENT ====================

  async getUserAchievements(uuid: string): Promise<AchievementDetails[]> {
    try {
      return await this.achievementService.getUserAchievements(uuid);
    } catch (error) {
      console.error(`Error getting achievements for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve achievements: ${error.message}`);
    }
  }

  async getUserAchievementById(uuid: string, achievementId: string): Promise<AchievementDetails> {
    try {
      return await this.achievementService.getUserAchievementById(uuid, achievementId);
    } catch (error) {
      console.error(`Error getting achievement ${achievementId} for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve achievement: ${error.message}`);
    }
  }

  // ==================== BATTLE ACHIEVEMENT MANAGEMENT ====================

  async addBattleAchievement(battleData: BattleAchievementRequest): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.battleAchievementService.addBattleAchievement(battleData);
    } catch (error) {
      console.error('Error adding battle achievement:', error);
      throw new Error(`Failed to add battle achievement: ${error.message}`);
    }
  }

  // ==================== REPLAY MANAGEMENT ====================

  async getUserReplay(uuid: string, replayId: number): Promise<ReplayDetails> {
    try {
      return await this.replayService.getUserReplay(uuid, replayId);
    } catch (error) {
      console.error(`Error getting replay ${replayId} for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve replay: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validateAchievementExists(achievementId: string): Promise<boolean> {
    try {
      return await this.achievementService.validateAchievementExists(achievementId);
    } catch (error) {
      console.error(`Error validating achievement ${achievementId}:`, error);
      return false;
    }
  }
}