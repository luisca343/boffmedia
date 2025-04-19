import { ApiProperty } from '@nestjs/swagger';

export class ArcadeStreak {
  @ApiProperty({
    description: 'When the streak was last claimed',
    example: '2025-04-17T14:30:00Z'
  })
  lastClaimed: Date;

  @ApiProperty({
    description: 'Current streak count',
    example: 3
  })
  streak: number;

  @ApiProperty({
    description: 'Total number of claims made',
    example: 15
  })
  totalClaims: number;
  
  @ApiProperty({
    description: 'Current day in the reward cycle',
    example: 3
  })
  currentDay?: number;
  
  @ApiProperty({
    description: 'Total days in the reward cycle',
    example: 7
  })
  totalDays?: number;
  
  @ApiProperty({
    description: 'Next reward information'
  })
  nextReward?: {
    day: number;
    type: string;
    amount: number;
    description?: string;
  };

  @ApiProperty({
    description: 'Last banner shown to the user',
    example: 'https://example.com/banner.png'
  })
  lastBanner?: string;

  @ApiProperty({
    description: 'Current streak banner',
    example: 'https://example.com/current-banner.png'
  })
  currentBanner?: string;

  @ApiProperty({
    description: 'Whether the reward has been claimed today after reset time',
    example: false
  })
  claimedToday?: boolean;
  
  @ApiProperty({
    description: 'Next reset time (6:00 AM)',
    example: '2025-04-20T06:00:00Z'
  })
  nextResetTime?: Date;

  @ApiProperty({
    description: 'Whether the banner has changed',
    example: true
  })
  bannerChanged?: boolean;
}

export class ClaimRewardResponse {
  @ApiProperty({
    description: 'Whether the reward was successfully claimed',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Details about the reward given'
  })
  rewardGiven: {
    day: number;
    type: string;
    amount: number;
    description?: string;
  };

  @ApiProperty({
    description: 'New streak count after claiming',
    example: 4
  })
  newStreak: number;
  
  @ApiProperty({
    description: 'Current day in the reward cycle',
    example: 4
  })
  currentDay?: number;
  
  @ApiProperty({
    description: 'Total days in the reward cycle',
    example: 7
  })
  totalDays?: number;
  
  @ApiProperty({
    description: 'Next reward information'
  })
  nextReward?: {
    day: number;
    type: string;
    amount: number;
    description?: string;
  };

  @ApiProperty({
    description: 'Additional message (if any)',
    example: 'You got a bonus reward for your 7-day streak!'
  })
  message?: string;

  @ApiProperty({
    description: 'Banner name shown to the user',
    example: 'Bienvenida'
  })
  bannerName?: string;
}