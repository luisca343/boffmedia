import { FileUtils } from '@/_utils/FileUtils';
import { DailyRewardsConfig } from '@api/smartrotom/arcade/entities/daily-rewards.entity';

export function loadRewardsConfig(): DailyRewardsConfig {
  return FileUtils.readJsonFile('data/smartrotom/daily-rewards.json');
}
