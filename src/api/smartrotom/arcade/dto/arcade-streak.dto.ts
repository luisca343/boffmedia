import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetStreakDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class ClaimRewardDto extends BaseDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class DailyRewardItem {
  @ApiProperty({ description: 'Day number in the cycle', example: 1 })
  day: number;

  @ApiProperty({ description: 'Type of reward', example: 'box' })
  type: string;

  @ApiProperty({ description: 'Amount of the reward', example: 1 })
  amount: number;

  @ApiProperty({ description: 'Description of the reward', example: 'trainer_box' })
  description: string;
}

export class DailyRewardsConfig {
  @ApiProperty({ description: 'Total days in the reward cycle', example: 7 })
  totalDays: number;

  @ApiProperty({ description: 'Banner name', example: 'Recompensas de Bienvenida' })
  name: string;

  @ApiProperty({ 
    description: 'Rewards for each day',
    type: [DailyRewardItem],
    example: [
      {
        "day": 1,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      },
      {
        "day": 2,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      },
      {
        "day": 3,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      },
      {
        "day": 4,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      },
      {
        "day": 5,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      },
      {
        "day": 6,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      },
      {
        "day": 7,
        "type": "box",
        "amount": 1,
        "description": "trainer_box"
      }
    ]
  })
  rewards: DailyRewardItem[];
}

export class ArcadeStreak {
  @ApiProperty({ description: 'Last time reward was claimed', required: false, example: null })
  lastClaimed: Date | null;

  @ApiProperty({ description: 'Current streak count', example: 0 })
  streak: number;

  @ApiProperty({ description: 'Total claims made', example: 0 })
  totalClaims: number;

  @ApiProperty({ description: 'Last banner used', required: false, example: null })
  lastBanner: string | null;

  @ApiProperty({ description: 'Current day in the cycle', example: 1 })
  currentDay: number;

  @ApiProperty({ description: 'Total days in the reward cycle', example: 7 })
  totalDays: number;

  @ApiProperty({ description: 'Next reward details', type: DailyRewardItem })
  nextReward: DailyRewardItem;

  @ApiProperty({ description: 'Current banner name', example: 'Recompensas de Bienvenida' })
  currentBanner: string;

  @ApiProperty({ description: 'Whether reward was already claimed today', example: false })
  claimedToday: boolean;

  @ApiProperty({ description: 'Next reset time', example: '2025-06-14T04:00:00.000Z' })
  nextResetTime: string;

  @ApiProperty({ description: 'Whether the banner has changed', required: false, example: null })
  bannerChanged: boolean | null;
}

export class ClaimRewardResponse {
  @ApiProperty({ description: 'Whether the claim was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'The reward that was given', required: false, type: DailyRewardItem })
  rewardGiven: DailyRewardItem | null;

  @ApiProperty({ description: 'New streak count', example: 1 })
  newStreak: number;

  @ApiProperty({ description: 'Current day in cycle', required: false, example: 1 })
  currentDay?: number;

  @ApiProperty({ description: 'Total days in cycle', required: false, example: 7 })
  totalDays?: number;

  @ApiProperty({ description: 'Next reward details', required: false, type: DailyRewardItem })
  nextReward?: DailyRewardItem;

  @ApiProperty({ description: 'Response message', example: 'Daily reward claimed successfully!' })
  message: string;

  @ApiProperty({ description: 'Banner name', required: false, example: 'Recompensas de Bienvenida' })
  bannerName?: string;
}