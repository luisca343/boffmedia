import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class JoinTeamDto {
  @ApiProperty({ description: 'The ID of the participant joining the team' })
  @IsInt()
  @Min(1)
  participantId: number;
}
