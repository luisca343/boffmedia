import { ApiProperty } from '@nestjs/swagger';

export class JoinTeamDto {
  @ApiProperty({ description: 'The ID of the user joining the team' })
  userId: number;
}
