import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ description: 'The ID of the user' })
  userId: number;

  @ApiProperty({ description: 'The ID of the medal' })
  medalId: number;

  @ApiProperty({ description: 'The progress to update' })
  progress: number;

  @ApiProperty({ description: 'The ID of the team (for team medals)', required: false })
  teamId?: number;
}