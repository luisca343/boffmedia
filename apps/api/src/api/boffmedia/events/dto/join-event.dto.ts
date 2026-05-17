import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinEventDto {
  @ApiProperty({ description: 'The user ID trying to join the event' })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Optional nickname for the participant',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiProperty({ description: 'Optional avatar URL', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string;

  @ApiProperty({
    description: 'Optional comment or reason for joining',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
