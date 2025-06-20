import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IAchievementsRepository extends BaseRepository<any, any, any> {
  findUserAchievements(uuid: string): Promise<any[]>;
  findUserAchievementById(uuid: string, achievementId: string): Promise<any | null>;
  findUserAchievementStatus(uuid: string, achievementId: string): Promise<any | null>;
  createUserAchievement(achievementData: any): Promise<{ insertId: number }>;
  achievementExists(achievementId: string): Promise<boolean>;
}