import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, Min, IsDateString, IsOptional } from 'class-validator';

export class CreateUserAchievementDto extends BaseDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Achievement ID',
    example: 'medalla_denki'
  })
  @IsString()
  achievementId: string;

  @ApiProperty({ 
    description: 'Progress towards achievement',
    example: 1
  })
  @IsInt()
  @Min(0)
  progress: number;

  @ApiProperty({ 
    description: 'Completion status (0 = not completed, 1 = completed)',
    example: 1
  })
  @IsInt()
  @Min(0)
  completed: number;

  @ApiProperty({ 
    description: 'Data ID (replay ID)',
    example: 123,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  dataId?: number;

  @ApiProperty({ 
    description: 'Completion date',
    example: '2023-12-01T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}