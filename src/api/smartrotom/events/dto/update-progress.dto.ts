import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ description: 'The ID of the participant' })
  participantId: number;

  @ApiProperty({ description: 'The ID of the achievement' })
  achievementId: number;

  @ApiProperty({ description: 'The progress to update' })
  progress: number;

  @ApiProperty({ description: 'The ID of the team (optional)', required: false })
  teamId?: number;
}