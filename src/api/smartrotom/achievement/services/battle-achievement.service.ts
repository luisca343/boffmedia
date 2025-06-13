import { Injectable } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { ReplayService } from './replay.service';
import { AchievementRepository } from '@repositories/smartrotom/achievement.repository';

export interface BattleAchievementRequest {
  uuid: string;
  logro: string;
  name1: string;
  name2: string;
  team1: any;
  team2: any;
  replay: string;
  victoria: boolean;
}

@Injectable()
export class BattleAchievementService {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly replayService: ReplayService,
    private readonly achievementRepository: AchievementRepository,
  ) {}

  async addBattleAchievement(battleData: BattleAchievementRequest): Promise<{ success: boolean; error?: string }> {
    const { uuid, logro, name1, name2, team1, team2, replay, victoria } = battleData;

    // Validate input
    if (!uuid || !logro || !name1 || !name2 || !team1 || !team2 || !replay) {
      throw new Error('All battle data fields are required');
    }

    // Check if user already has this achievement
    const hasAchievement = await this.achievementService.checkUserHasAchievement(uuid, logro);
    
    if (hasAchievement.error) {
      return { success: false, error: hasAchievement.error };
    }

    if (hasAchievement.completed) {
      return { success: false, error: 'Achievement already completed' };
    }

    // Create replay
    const replayResult = await this.replayService.createReplay({
      side1: name1,
      side2: name2,
      team1: JSON.stringify(team1),
      team2: JSON.stringify(team2),
      replay,
      winner: victoria ? name1 : name2
    });

    // Create user replay relation
    await this.replayService.createUserReplay(replayResult.replayId, uuid, 1);

    // Create user achievement
    await this.achievementRepository.createUserAchievement({
      dataId: replayResult.replayId,
      uuid,
      achievementId: logro,
      progress: 1,
      completed: 1,
      completedAt: new Date()
    });

    return { success: true };
  }
}