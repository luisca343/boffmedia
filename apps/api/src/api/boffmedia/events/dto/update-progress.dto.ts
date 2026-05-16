import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({
    description: 'The ID of the participant',
  })
  @IsInt()
  @Min(1)
  participantId: number;

  @ApiProperty({
    description: 'The ID of the achievement',
  })
  @IsInt()
  @Min(1)
  achievementId: number;

  @ApiProperty({
    description: 'The progress amount to add',
    example: 1,
  })
  @IsInt()
  @Min(0)
  progress: number;

  @ApiProperty({
    description: 'The team ID if this is team progress',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  teamId?: number;
}
