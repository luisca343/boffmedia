import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IArcadeStreakRepository extends BaseRepository<any, any, any> {
  findByUuid(uuid: string): Promise<any | null>;
  createUserStreak(streakData: any): Promise<{ insertId: number }>;
  updateUserStreak(uuid: string, streakData: any): Promise<any>;
  resetStreak(uuid: string): Promise<boolean>;
  incrementStreak(uuid: string): Promise<any>;
  canClaimToday(uuid: string): Promise<boolean>;
  getStreakStats(uuid: string): Promise<any | null>;
}