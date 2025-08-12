import { ApiProperty } from '@nestjs/swagger';

export class ArcadeStreak {
  @ApiProperty({ 
    example: '2023-11-01T10:00:00Z', 
    description: 'Last time the user claimed a reward',
    nullable: true
  })
  lastClaimed: Date | null;

  @ApiProperty({ 
    example: 3, 
    description: 'Current streak count' 
  })
  streak: number;

  @ApiProperty({ 
    example: 10, 
    description: 'Total number of claims made' 
  })
  totalClaims: number;

  @ApiProperty({ 
    example: 'winter_2023', 
    description: 'Last banner the user interacted with',
    nullable: true 
  })
  lastBanner: string | null;

  @ApiProperty({ 
    example: 3, 
    description: 'Current day in the reward cycle' 
  })
  currentDay: number;

  @ApiProperty({ 
    example: 7, 
    description: 'Total days in the reward cycle' 
  })
  totalDays: number;

  @ApiProperty({ 
    description: 'Next reward information',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      day: 3,
      type: 'CURRENCY',
      amount: 150,
      description: 'Day 3 reward'
    }
  })
  nextReward: {
    day: number;
    type: string;
    amount: number;
    description: string;
  };

  @ApiProperty({ 
    example: 'winter_2023', 
    description: 'Current active banner' 
  })
  currentBanner: string;

  @ApiProperty({ 
    example: false, 
    description: 'Whether user has claimed reward today' 
  })
  claimedToday: boolean;

  @ApiProperty({ 
    example: '2023-11-02T06:00:00Z', 
    description: 'Next daily reset time' 
  })
  nextResetTime: string;

  @ApiProperty({ 
    example: false, 
    description: 'Whether banner has changed since last claim' 
  })
  bannerChanged: boolean;
}