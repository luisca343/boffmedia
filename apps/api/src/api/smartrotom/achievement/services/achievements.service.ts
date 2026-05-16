import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IAchievementsRepository } from '../repositories/interfaces/achievements.repository.interface';
import { ACHIEVEMENTS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';
import { UserAchievement } from '../entities/achievement.entity';
import { UserAchievementEntity } from '../entities/user-achievement.entity';
import { AchievementStatusEntity } from '../entities/achievement-status.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @Inject(ACHIEVEMENTS_REPOSITORY_TOKEN)
    private readonly achievementsRepository: IAchievementsRepository,
  ) {}

  async getUserAchievements(uuid: string): Promise<UserAchievement[]> {
    this.validateUuid(uuid);
    return this.achievementsRepository.findUserAchievements(uuid);
  }

  async getUserAchievementById(
    uuid: string,
    achievementId: string,
  ): Promise<UserAchievement> {
    this.validateUuid(uuid);
    this.validateAchievementId(achievementId);

    const achievement =
      await this.achievementsRepository.findUserAchievementById(
        uuid,
        achievementId,
      );
    if (!achievement) {
      throw new NotFoundException('Achievement not found');
    }

    return achievement;
  }

  async checkUserHasAchievement(
    uuid: string,
    achievementId: string,
  ): Promise<{ completed: number | null; error?: string }> {
    this.validateUuid(uuid);
    this.validateAchievementId(achievementId);

    const status = await this.achievementsRepository.findUserAchievementStatus(
      uuid,
      achievementId,
    );
    if (!status) {
      return { error: 'Achievement not found', completed: null };
    }

    return { completed: status.completed };
  }

  async validateAchievementExists(achievementId: string): Promise<boolean> {
    try {
      return await this.achievementsRepository.achievementExists(achievementId);
    } catch {
      return false;
    }
  }

  async createUserAchievement(
    achievementData: UserAchievementEntity,
  ): Promise<BaseInsertResponse> {
    this.validateUuid(achievementData.uuid);
    this.validateAchievementId(achievementData.achievementId);

    return this.achievementsRepository.createUserAchievement(achievementData);
  }

  // ==================== VALIDATION METHODS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  private validateAchievementId(achievementId: string): void {
    if (!achievementId) {
      throw new BadRequestException('Achievement ID is required');
    }
  }
}
