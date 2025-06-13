import { Injectable } from '@nestjs/common';
import { AchievementRepository, AchievementDetails, UserAchievementStatus } from '@repositories/smartrotom/achievement.repository';

@Injectable()
export class AchievementService {
  constructor(
    private readonly achievementRepository: AchievementRepository,
  ) {}

  async getUserAchievements(uuid: string): Promise<AchievementDetails[]> {
    if (!uuid) {
      throw new Error('UUID is required');
    }

    return this.achievementRepository.findUserAchievements(uuid);
  }

  async getUserAchievementById(uuid: string, achievementId: string): Promise<AchievementDetails> {
    if (!uuid) {
      throw new Error('UUID is required');
    }

    if (!achievementId) {
      throw new Error('Achievement ID is required');
    }

    const achievement = await this.achievementRepository.findUserAchievementById(uuid, achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    return achievement;
  }

  async checkUserHasAchievement(uuid: string, achievementId: string): Promise<{ completed: number | null; error?: string }> {
    if (!uuid) {
      throw new Error('UUID is required');
    }

    if (!achievementId) {
      throw new Error('Achievement ID is required');
    }

    const status = await this.achievementRepository.findUserAchievementStatus(uuid, achievementId);
    if (!status) {
      return { error: 'Achievement not found', completed: null };
    }

    return { completed: status.completed };
  }

  async validateAchievementExists(achievementId: string): Promise<boolean> {
    try {
      const status = await this.achievementRepository.findUserAchievementStatus('temp', achievementId);
      return !!status;
    } catch {
      return false;
    }
  }
}