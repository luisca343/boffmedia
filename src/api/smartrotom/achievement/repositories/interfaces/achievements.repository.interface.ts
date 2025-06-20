import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';
import { Achievement, UserAchievement } from '../../entities/achievement.entity';
import { UserAchievementEntity } from '../../entities/user-achievement.entity';
import { AchievementStatusEntity } from '../../entities/achievement-status.entity';
import { CreateAchievementDto } from '../../dto/create-achievement.dto';
import { UpdateAchievementDto } from '../../dto/update-achievement.dto';

export interface IAchievementsRepository extends BaseRepository<Achievement, CreateAchievementDto, UpdateAchievementDto> {
  findUserAchievements(uuid: string): Promise<UserAchievement[]>;
  findUserAchievementById(uuid: string, achievementId: string): Promise<UserAchievement | null>;
  findUserAchievementStatus(uuid: string, achievementId: string): Promise<AchievementStatusEntity | null>;
  createUserAchievement(achievementData: UserAchievementEntity): Promise<BaseInsertResponse>;
  achievementExists(achievementId: string): Promise<boolean>;
}