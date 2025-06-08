import { Injectable } from '@nestjs/common';
import { MineRepository, MineRewardItem } from '@repositories/smartrotom/mine.repository';

export interface RewardsByType {
  drops: { [key: string]: { items: MineRewardItem[]; totalValue: number } };
  totalValue: number;
}

@Injectable()
export class RewardService {
  constructor(
    private readonly mineRepository: MineRepository,
  ) {}

  async getAllRewards(): Promise<MineRewardItem[]> {
    return this.mineRepository.findAllRewards();
  }

  async getRewardsByType(): Promise<RewardsByType> {
    const rewards = await this.mineRepository.findAllRewards();
    
    const groupedByType = rewards.reduce((acc, reward) => {
      if (!acc[reward.type]) {
        acc[reward.type] = { items: [], totalValue: 0 };
      }
      acc[reward.type].items.push(reward);
      acc[reward.type].totalValue += reward.value;
      return acc;
    }, {} as { [key: string]: { items: MineRewardItem[]; totalValue: number } });

    // Sort by total value (descending)
    const sortedEntries = Object.entries(groupedByType)
      .sort(([, a], [, b]) => b.totalValue - a.totalValue);

    const sortedGrouped = Object.fromEntries(sortedEntries);

    const totalValue = Object.values(sortedGrouped)
      .reduce((sum, type) => sum + type.totalValue, 0);

    return {
      drops: sortedGrouped,
      totalValue
    };
  }

  async getRewardById(id: number): Promise<MineRewardItem | null> {
    const rewards = await this.mineRepository.findRewardsByIds([id]);
    return rewards[0] || null;
  }

  async validateRewardsExist(rewardIds: number[]): Promise<boolean> {
    if (rewardIds.length === 0) return true;
    
    const rewards = await this.mineRepository.findRewardsByIds(rewardIds);
    return rewards.length === rewardIds.length;
  }

  async getRewardDropRates(): Promise<{ [rewardId: number]: { name: string; dropRate: number } }> {
    const rewards = await this.mineRepository.findAllRewards();
    const totalWeight = rewards.reduce((sum, reward) => sum + reward.value, 0);
    
    const dropRates: { [rewardId: number]: { name: string; dropRate: number } } = {};
    
    rewards.forEach(reward => {
      dropRates[reward.id] = {
        name: reward.name,
        dropRate: (reward.value / totalWeight) * 100
      };
    });

    return dropRates;
  }
}