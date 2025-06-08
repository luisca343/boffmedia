import { ApiProperty } from '@nestjs/swagger';

export class JoinTeamDto {
  @ApiProperty({ description: 'The ID of the participant joining the team' })
  participantId: number;
}
