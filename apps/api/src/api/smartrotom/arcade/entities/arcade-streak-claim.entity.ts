import { ApiProperty } from '@nestjs/swagger';
import { ArcadeStreak } from './arcade-streak.entity';
import { ArcadeInventoryItem } from './arcade-inventory.entity';
import { DailyRewardItem } from './daily-rewards.entity';

export class ArcadeStreakClaim {
  @ApiProperty({
    description: 'Updated streak information after claim',
    type: ArcadeStreak,
  })
  streak: ArcadeStreak;

  @ApiProperty({
    description: 'The reward that was claimed',
    type: DailyRewardItem,
  })
  reward: DailyRewardItem;

  @ApiProperty({
    description: 'Items added to inventory as part of the claim',
    type: [ArcadeInventoryItem],
    required: false,
  })
  inventoryItems?: ArcadeInventoryItem[];
}
