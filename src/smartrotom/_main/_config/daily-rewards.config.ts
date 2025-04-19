import { FileUtils } from '@/_utils/fileUtils';

export interface DailyRewardItem {
  day: number;
  type: string;
  amount: number;
  description?: string;
}

export interface DailyRewardsConfig {
  totalDays: number;
  name: string;
  rewards: DailyRewardItem[];
}

export function loadRewardsConfig(): DailyRewardsConfig {
  return FileUtils.readJsonFile('/public/data/wingull/daily-rewards.json');
}