import { FileUtils } from '@/_utils/FileUtils';
import { DailyRewardsConfig } from '@api/smartrotom/arcade/entities/daily-rewards.entity';

export function loadRewardsConfig(): DailyRewardsConfig {
  return FileUtils.readJsonFile('/public/data/wingull/daily-rewards.json');
}