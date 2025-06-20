import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ARCADE_STREAK_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IArcadeStreakRepository } from '../repositories/interfaces/arcade-streak.repository.interface';
import { CreateArcadeStreakDto } from '../dto/create-arcade-streak.dto';
import { UpdateArcadeStreakDto } from '../dto/update-arcade-streak.dto';
import { ArcadeStreak } from '../entities/arcade-streak.entity';

@Injectable()
export class StreakService {
  constructor(
    @Inject(ARCADE_STREAK_REPOSITORY_TOKEN)
    private readonly arcadeStreakRepository: IArcadeStreakRepository,
  ) {}

  // ==================== VALIDATION METHODS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  // ==================== STREAK MANAGEMENT ====================

  async getUserStreak(uuid: string): Promise<ArcadeStreak> {
    this.validateUuid(uuid);

    let streak = await this.arcadeStreakRepository.findByUuid(uuid);
    
    if (!streak) {
      // Create new streak record for user
      const newStreakData: CreateArcadeStreakDto = {
        uuid,
        streak: 0,
        totalClaims: 0
      };
      
      const result = await this.arcadeStreakRepository.createUserStreak(newStreakData);
      streak = await this.arcadeStreakRepository.findById(result.insertId);
      
      if (!streak) {
        throw new NotFoundException('Failed to create streak record');
      }
    }

    return streak;
  }

  async canClaimReward(uuid: string): Promise<{ canClaim: boolean; streak: ArcadeStreak }> {
    this.validateUuid(uuid);

    const streak = await this.getUserStreak(uuid);
    const canClaim = await this.arcadeStreakRepository.canClaimToday(uuid);

    return { canClaim, streak };
  }

  async claimDailyReward(uuid: string): Promise<{ 
    success: boolean; 
    streak: ArcadeStreak; 
    reward: any;
    message: string;
  }> {
    this.validateUuid(uuid);

    const { canClaim, streak } = await this.canClaimReward(uuid);

    if (!canClaim) {
      throw new BadRequestException('Daily reward already claimed today');
    }

    // Check if streak should continue or reset
    const shouldResetStreak = this.shouldResetStreak(streak);
    
    let updatedStreak: ArcadeStreak;
    
    if (shouldResetStreak) {
      // Reset streak and start over
      await this.arcadeStreakRepository.resetStreak(uuid);
      updatedStreak = await this.arcadeStreakRepository.incrementStreak(uuid);
    } else {
      // Continue streak
      updatedStreak = await this.arcadeStreakRepository.incrementStreak(uuid);
    }

    // Calculate reward based on streak
    const reward = this.calculateReward(updatedStreak.streak);

    return {
      success: true,
      streak: updatedStreak,
      reward,
      message: `Day ${updatedStreak.streak} reward claimed!`
    };
  }

  async resetUserStreak(uuid: string): Promise<{ success: boolean; message: string }> {
    this.validateUuid(uuid);

    const success = await this.arcadeStreakRepository.resetStreak(uuid);
    
    if (!success) {
      throw new NotFoundException('Streak not found or already reset');
    }

    return {
      success: true,
      message: 'Streak reset successfully'
    };
  }

  async getStreakStats(uuid: string): Promise<ArcadeStreak> {
    this.validateUuid(uuid);

    const stats = await this.arcadeStreakRepository.getStreakStats(uuid);
    
    if (!stats) {
      throw new NotFoundException('Streak stats not found');
    }

    return stats;
  }

  async updateLastBanner(uuid: string, banner: string): Promise<ArcadeStreak> {
    this.validateUuid(uuid);

    if (!banner) {
      throw new BadRequestException('Banner name is required');
    }

    const updateData: UpdateArcadeStreakDto = {
      lastBanner: banner
    };

    const streak = await this.arcadeStreakRepository.findByUuid(uuid);
    if (!streak) {
      throw new NotFoundException('Streak record not found');
    }

    return this.arcadeStreakRepository.updateUserStreak(uuid, updateData);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private shouldResetStreak(streak: ArcadeStreak): boolean {
    if (!streak.lastClaimed) return false;

    const now = new Date();
    const lastClaim = new Date(streak.lastClaimed);
    
    // Reset if more than 2 days have passed
    const daysDifference = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDifference > 1;
  }

  private calculateReward(streakDay: number): any {
    // Basic reward calculation - can be enhanced with your lootbox config
    const baseReward = {
      coins: 100 * streakDay,
      experience: 50 * streakDay,
      items: []
    };

    // Special rewards for milestone days
    if (streakDay % 7 === 0) {
      baseReward.items.push({
        itemId: 'weekly_bonus',
        itemType: 'bonus',
        amount: 1,
        rarity: 'rare'
      });
    }

    if (streakDay % 30 === 0) {
      baseReward.items.push({
        itemId: 'monthly_bonus',
        itemType: 'bonus',
        amount: 1,
        rarity: 'legendary'
      });
    }

    return baseReward;
  }
}