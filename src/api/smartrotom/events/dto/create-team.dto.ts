import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ 
    description: 'The name of the team',
    example: 'Team Alpha'
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ 
    description: 'The team tag/code', 
    example: 'ALPH',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  tag?: string;

  @ApiProperty({ 
    description: 'The team icon URL', 
    example: '/icons/team-alpha.png',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @ApiProperty({ 
    description: 'The user ID of the team leader',
    example: 1
  })
  @IsInt()
  @Min(1)
  leaderId: number;
}