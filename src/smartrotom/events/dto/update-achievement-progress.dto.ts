import { ApiProperty } from '@nestjs/swagger';

export class UpdateAchievementProgressDto {
  @ApiProperty({ description: 'The participant ID' })
  participantId: number;

  @ApiProperty({ description: 'The achievement ID' })
  achievementId: number;

  @ApiProperty({ description: 'The progress to update' })
  progress: number;
}