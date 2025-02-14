import { ApiProperty } from '@nestjs/swagger';

export class UpdateAchievementProgressDto {
  @ApiProperty({ description: 'The user ID' })
  userId: number;

  @ApiProperty({ description: 'The achievement ID' })
  achievementId: number;

  @ApiProperty({ description: 'The progress to update' })
  progress: number;
}