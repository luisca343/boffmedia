import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { ReplaysService } from './replays.service';
import { UserAchievementEntity } from '../entities/user-achievement.entity';
import { CreateReplayFullDto } from '../dto/create-replay-full.dto';

export interface BattleAchievementRequest {
  uuid: string;
  logro: string;
  name1: string;
  name2: string;
  team1: any[];
  team2: any[];
  replay: string;
  victoria: boolean;
}

@Injectable()
export class BattleAchievementService {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly replaysService: ReplaysService,
  ) {}

  async processBattleAchievement(
    battleData: BattleAchievementRequest,
  ): Promise<{ success: boolean; message: string }> {
    this.validateBattleData(battleData);

    // Check if achievement exists
    const achievementExists =
      await this.achievementsService.validateAchievementExists(
        battleData.logro,
      );
    if (!achievementExists) {
      throw new NotFoundException('Achievement not found');
    }

    // Check if user already has this achievement
    const userAchievementStatus =
      await this.achievementsService.checkUserHasAchievement(
        battleData.uuid,
        battleData.logro,
      );

    if (userAchievementStatus.completed === 1) {
      return {
        success: false,
        message: 'Achievement already completed',
      };
    }

    // Only process if user won the battle (for most achievements)
    if (!battleData.victoria) {
      return {
        success: false,
        message: 'Achievement requires victory',
      };
    }

    // Create replay first
    const replayData: CreateReplayFullDto = {
      side1: battleData.name1,
      side2: battleData.name2,
      team1: JSON.stringify(battleData.team1),
      team2: JSON.stringify(battleData.team2),
      replay: battleData.replay,
      winner: battleData.name1, // Assuming name1 is the winner based on victoria = true
    };

    const replayResult = await this.replaysService.createReplay(replayData);

    // Create user replay association
    await this.replaysService.createUserReplay(
      battleData.uuid,
      replayResult.insertId,
    );

    // Create user achievement
    const achievementData: UserAchievementEntity = {
      uuid: battleData.uuid,
      achievementId: battleData.logro,
      progress: 1,
      completed: 1,
      dataId: replayResult.insertId,
      completedAt: new Date(),
    };

    await this.achievementsService.createUserAchievement(achievementData);

    return {
      success: true,
      message: 'Achievement unlocked successfully',
    };
  }

  // ==================== VALIDATION METHODS ====================

  private validateBattleData(battleData: BattleAchievementRequest): void {
    if (!battleData.uuid) {
      throw new BadRequestException('UUID is required');
    }
    if (!battleData.logro) {
      throw new BadRequestException('Achievement ID is required');
    }
    if (!battleData.name1) {
      throw new BadRequestException('Player 1 name is required');
    }
    if (!battleData.name2) {
      throw new BadRequestException('Player 2 name is required');
    }
    if (!battleData.team1 || !Array.isArray(battleData.team1)) {
      throw new BadRequestException(
        'Player 1 team data is required and must be an array',
      );
    }
    if (!battleData.team2 || !Array.isArray(battleData.team2)) {
      throw new BadRequestException(
        'Player 2 team data is required and must be an array',
      );
    }
    if (!battleData.replay) {
      throw new BadRequestException('Replay data is required');
    }
    if (typeof battleData.victoria !== 'boolean') {
      throw new BadRequestException('Victory status is required');
    }
  }
}
