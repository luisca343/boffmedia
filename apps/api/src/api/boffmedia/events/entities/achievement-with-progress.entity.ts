import { ApiProperty } from '@nestjs/swagger';
import { Achievement } from './achievement.entity';

export class AchievementWithProgress extends Achievement {
  @ApiProperty({
    example: 5,
    description: 'Current progress towards the achievement',
  })
  currentProgress: number;

  @ApiProperty({
    example: true,
    description: 'Whether the achievement is completed',
  })
  isCompleted: boolean;

  @ApiProperty({
    example: '2024-06-01T12:30:00.000Z',
    description: 'When the achievement was completed',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    example: '2024-06-01T12:30:00.000Z',
    description: 'When the progress was last updated',
  })
  lastUpdated: Date;
}
