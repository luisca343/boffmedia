import { ApiProperty } from '@nestjs/swagger';

export class UserAchievementEntity {
  @ApiProperty({
    example: 'medalla_denki',
    description: 'Achievement ID',
  })
  achievementId: string;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Player UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 1,
    description: 'Current progress towards the achievement',
  })
  progress: number;

  @ApiProperty({
    example: 1,
    description: 'Completion status (0 = not completed, 1 = completed)',
  })
  completed: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'When the achievement was completed',
    nullable: true,
  })
  completedAt: Date | null;

  @ApiProperty({
    example: 123,
    description: 'Data ID (replay ID) associated with this achievement',
    nullable: true,
  })
  dataId: number | null;
}
