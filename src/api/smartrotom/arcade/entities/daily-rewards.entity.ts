import { ApiProperty } from '@nestjs/swagger';

export class DailyRewardBox {
  @ApiProperty({
    example: 'trainer_box',
    description: 'Identifier of the box to be given as reward'
  })
  description: string;
}

export class DailyRewardItem {
  @ApiProperty({
    example: 1,
    description: 'Day number in the streak cycle'
  })
  day: number;

  @ApiProperty({
    example: 'box',
    description: 'Type of reward (box, coins, item, etc)',
    enum: ['box', 'coins', 'item', 'experience']
  })
  type: string;

  @ApiProperty({
    example: 1,
    description: 'Amount of the reward to give'
  })
  amount: number;

  @ApiProperty({
    example: 'trainer_box',
    description: 'Additional details about the reward, like box type or item ID'
  })
  description: string;

  @ApiProperty({
    type: DailyRewardBox,
    required: false,
    description: 'Details about the box if the reward is a box'
  })
  box?: DailyRewardBox;
}

export class DailyRewardsConfig {
  @ApiProperty({
    example: 7,
    description: 'Number of days in the reward cycle'
  })
  totalDays: number;

  @ApiProperty({
    example: 'Recompensas de Bienvenida',
    description: 'Name of this rewards banner'
  })
  name: string;

  @ApiProperty({
    type: [DailyRewardItem],
    description: 'List of daily rewards',
    example: [
      { day: 1, type: 'box', amount: 1, description: 'trainer_box' },
      { day: 2, type: 'coins', amount: 100, description: 'Daily coins' },
      { day: 3, type: 'item', amount: 1, description: 'pixelmon:master_ball' }
    ]
  })
  rewards: DailyRewardItem[];
}