import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetStreakDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class ClaimRewardDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class DailyRewardItem {
  @ApiProperty({ description: 'Day number in the cycle', example: 1 })
  day: number;

  @ApiProperty({ description: 'Type of reward', example: 'CURRENCY' })
  type: string;

  @ApiProperty({ description: 'Amount of the reward', example: 100 })
  amount: number;

  @ApiProperty({ description: 'Description of the reward', example: 'Daily bonus coins' })
  description: string;
}

export class ArcadeStreak {
  @ApiProperty({ description: 'Last time reward was claimed', required: false })
  lastClaimed: Date | null;

  @ApiProperty({ description: 'Current streak count', example: 5 })
  streak: number;

  @ApiProperty({ description: 'Total claims made', example: 25 })
  totalClaims: number;

  @ApiProperty({ description: 'Last banner used', required: false })
  lastBanner: string | null;

  @ApiProperty({ description: 'Current day in the cycle', example: 3 })
  currentDay: number;

  @ApiProperty({ description: 'Total days in the reward cycle', example: 7 })
  totalDays: number;

  @ApiProperty({ description: 'Next reward details', type: DailyRewardItem })
  nextReward: DailyRewardItem;

  @ApiProperty({ description: 'Current banner name', example: 'winter-2024' })
  currentBanner: string;

  @ApiProperty({ description: 'Whether reward was already claimed today', example: false })
  claimedToday: boolean;

  @ApiProperty({ description: 'Next reset time', example: '2024-01-01T06:00:00.000Z' })
  nextResetTime: string;

  @ApiProperty({ description: 'Whether the banner has changed', example: false })
  bannerChanged: boolean;
}

export class ClaimRewardResponse {
  @ApiProperty({ description: 'Whether the claim was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'The reward that was given', required: false, type: DailyRewardItem })
  rewardGiven: DailyRewardItem | null;

  @ApiProperty({ description: 'New streak count', example: 6 })
  newStreak: number;

  @ApiProperty({ description: 'Current day in cycle', required: false, example: 4 })
  currentDay?: number;

  @ApiProperty({ description: 'Total days in cycle', required: false, example: 7 })
  totalDays?: number;

  @ApiProperty({ description: 'Next reward details', required: false, type: DailyRewardItem })
  nextReward?: DailyRewardItem;

  @ApiProperty({ description: 'Response message', example: 'Daily reward claimed successfully!' })
  message: string;

  @ApiProperty({ description: 'Banner name', required: false, example: 'winter-2024' })
  bannerName?: string;
}