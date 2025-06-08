import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'The name of the team' })
  name: string;

  @ApiProperty({ description: 'The team tag/code', required: false })
  tag?: string;

  @ApiProperty({ description: 'The team icon URL', required: false })
  icon?: string;

  @ApiProperty({ description: 'The ID of the team leader' })
  leaderId: number;
}