import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';
import { CreateArcadeStreakDto } from '../../dto/create-arcade-streak.dto';
import { UpdateArcadeStreakDto } from '../../dto/update-arcade-streak.dto';

export interface IArcadeStreakRepository extends BaseRepository<any, any, any> {
  findByUuid(uuid: string): Promise<any | null>;
  createUserStreak(
    streakData: CreateArcadeStreakDto,
  ): Promise<{ insertId: number }>;
  updateUserStreak(
    uuid: string,
    streakData: UpdateArcadeStreakDto,
  ): Promise<any>;
  resetStreak(uuid: string): Promise<boolean>;
  incrementStreak(uuid: string): Promise<any>;
  canClaimToday(uuid: string): Promise<boolean>;
  getStreakStats(uuid: string): Promise<any | null>;
}
