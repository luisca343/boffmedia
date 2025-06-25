import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ARCADE_STREAK_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IArcadeStreakRepository } from '../repositories/interfaces/arcade-streak.repository.interface';
import { CreateArcadeStreakDto } from '../dto/create-arcade-streak.dto';
import { UpdateArcadeStreakDto } from '../dto/update-arcade-streak.dto';
import { ArcadeStreak } from '../entities/arcade-streak.entity';
import { loadRewardsConfig } from '@api/smartrotom/_main/_config/daily-rewards.config';

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
    
    // Get current time and reset time boundaries
    const now = new Date();
    const resetTime = this.getDailyResetTime(now);
    const nextResetTime = this.getNextResetTime(now, resetTime);
    
    // Get user streak record from database or create default
    let streakRecord = await this.arcadeStreakRepository.findByUuid(uuid);
    
    if (!streakRecord) {
      // Create new streak record for user
      const newStreakData: CreateArcadeStreakDto = {
        uuid,
        streak: 0,
        totalClaims: 0
      };
      
      const result = await this.arcadeStreakRepository.createUserStreak(newStreakData);
      streakRecord = await this.arcadeStreakRepository.findById(result.insertId);
      
      if (!streakRecord) {
        throw new NotFoundException('Failed to create streak record');
      }
    }
    
    // Get current rewards config
    const rewardsConfig = loadRewardsConfig();
    
    // Check if banner has changed
    const bannerChanged = streakRecord.lastBanner && streakRecord.lastBanner !== rewardsConfig.name;
    let effectiveStreak = bannerChanged ? 0 : streakRecord.streak;
    
    // Determine if user has claimed today
    let claimedToday = false;
    if (streakRecord.lastClaimed) {
      const lastClaimDate = new Date(streakRecord.lastClaimed);
      const currentResetTime = this.getDailyResetTime(now);
      
      if (now < currentResetTime) {
        // If we're before today's reset, check if claimed since yesterday's reset
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayResetTime = this.getDailyResetTime(yesterdayDate);
        claimedToday = lastClaimDate >= yesterdayResetTime;
      } else {
        // If we're after today's reset, check if claimed today
        if (this.isSameDay(lastClaimDate, now)) {
          claimedToday = lastClaimDate >= currentResetTime;
        }
      }
    }
    
    // Calculate current day in streak cycle
    let currentDay = effectiveStreak % rewardsConfig.totalDays;
    if (!claimedToday) currentDay = (currentDay + 1);
    if (currentDay === 0) currentDay = rewardsConfig.totalDays;
    
    // Get next reward information
    const nextReward = this.getRewardForDay(claimedToday ? currentDay + 1 : currentDay, rewardsConfig);
    
    // Return complete streak information
    return {
      lastClaimed: streakRecord.lastClaimed,
      streak: streakRecord.streak,
      totalClaims: streakRecord.totalClaims,
      lastBanner: streakRecord.lastBanner,
      currentDay,
      totalDays: rewardsConfig.totalDays,
      nextReward,
      currentBanner: rewardsConfig.name,
      claimedToday,
      nextResetTime: nextResetTime.toISOString(),
      bannerChanged,
    };
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
    const rewardsConfig = loadRewardsConfig();
    const reward = this.getRewardForDay(streakDay, rewardsConfig);
    return reward;
  }

    private getDailyResetTime(date: Date): Date {
    const resetTime = new Date(date);
    resetTime.setHours(6, 0, 0, 0);
    return resetTime;
  }

  private getNextResetTime(now: Date, resetTime: Date): Date {
    const nextResetTime = new Date(resetTime);
    if (now >= resetTime) {
      nextResetTime.setDate(nextResetTime.getDate() + 1);
    }
    return nextResetTime;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private getRewardForDay(day: number, rewardsConfig: any): any {
    const dayInCycle = ((day - 1) % rewardsConfig.totalDays) + 1;
    const rewardConfig = rewardsConfig.rewards.find(r => r.day === dayInCycle);
    
    return rewardConfig || { 
      day: dayInCycle, 
      type: "CURRENCY", 
      amount: 100,
      description: `Day ${dayInCycle} reward`
    };
  }
}