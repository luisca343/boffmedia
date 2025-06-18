import { FileUtils } from '@/_utils/fileUtils';
import { DailyRewardItem } from '@api/smartrotom/arcade/dto/arcade-streak.dto';

export interface DailyRewardsConfig {
  totalDays: number;
  name: string;
  rewards: DailyRewardItem[];
}

export function loadRewardsConfig(): DailyRewardsConfig {
  return FileUtils.readJsonFile('/public/data/wingull/daily-rewards.json');
}