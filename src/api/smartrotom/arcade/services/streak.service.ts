import { Injectable } from '@nestjs/common';
import { ArcadeRepository } from '@repositories/smartrotom/arcade.repository';
import { ArcadeStreak, DailyRewardItem } from '../_dto/arcade-streak.dto';
import { DailyRewardsConfig } from '@api/smartrotom/_main/_config/daily-rewards.config';

@Injectable()
export class StreakService {
  constructor(
    private readonly arcadeRepository: ArcadeRepository,
  ) {}

  async getArcadeStreak(uuid: string, rewardsConfig: DailyRewardsConfig): Promise<ArcadeStreak> {
    const now = new Date();
    const resetTime = this.getDailyResetTime(now);
    const nextResetTime = this.getNextResetTime(now, resetTime);
    
    const streakRecord = await this.arcadeRepository.findStreakByUuid(uuid);
    
    const streak = {
      lastClaimed: streakRecord?.lastClaimed || null,
      streak: streakRecord?.streak || 0,
      totalClaims: streakRecord?.totalClaims || 0,
      lastBanner: streakRecord?.lastBanner || null
    };
    
    const bannerChanged = streak.lastBanner && streak.lastBanner !== rewardsConfig.name;
    let effectiveStreak = bannerChanged ? 0 : streak.streak;
    
    let claimedToday = false;
    if (streak.lastClaimed) {
      const lastClaimDate = new Date(streak.lastClaimed);
      const currentResetTime = this.getDailyResetTime(now);
      
      if (now < currentResetTime) {
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayResetTime = this.getDailyResetTime(yesterdayDate);
        claimedToday = lastClaimDate >= yesterdayResetTime;
      } else {
        if (this.isSameDay(lastClaimDate, now)) {
          claimedToday = lastClaimDate >= currentResetTime;
        }
      }
    }
    
    let currentDay = effectiveStreak % rewardsConfig.totalDays;
    if (!claimedToday) currentDay = (currentDay + 1);
    if (currentDay === 0) currentDay = rewardsConfig.totalDays;
    
    const nextReward = this.getRewardForDay(claimedToday ? currentDay + 1 : currentDay, rewardsConfig);
    
    return {
      lastClaimed: streak.lastClaimed,
      streak: streak.streak,
      totalClaims: streak.totalClaims,
      lastBanner: streak.lastBanner,
      currentDay,
      totalDays: rewardsConfig.totalDays,
      nextReward,
      currentBanner: rewardsConfig.name,
      claimedToday,
      nextResetTime: nextResetTime.toISOString(),
      bannerChanged,
    };
  }

  async updateStreak(uuid: string, data: {
    lastClaimed: Date;
    streak: number;
    totalClaims: number;
    lastBanner: string;
  }) {
    const existing = await this.arcadeRepository.findStreakByUuid(uuid);
    
    if (existing) {
      return this.arcadeRepository.updateStreak(uuid, data);
    } else {
      return this.arcadeRepository.createStreak(uuid, data);
    }
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

  private getRewardForDay(day: number, rewardsConfig: DailyRewardsConfig): DailyRewardItem {
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