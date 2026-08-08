import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinEventDto {
  // Identity is injected from the JWT in the controller, never trusted from the
  // body. Kept optional so an empty request body passes validation before the
  // handler overwrites it with req.user.userId.
  @IsOptional()
  @IsInt()
  userId?: number;

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
