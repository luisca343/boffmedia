import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetAchievementsDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;
}

export class GetAchievementByIdDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Achievement ID',
    example: 'medalla_tulipan'
  })
  @IsNotEmpty()
  @IsString()
  achievementId: string;
}

export class CheckAchievementDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Achievement ID to check',
    example: 'medalla_tulipan'
  })
  @IsNotEmpty()
  @IsString()
  achievementId: string;
}

export class AchievementStatusResponse {
  @ApiProperty({ 
    description: 'Completion status (0 = not completed, 1 = completed)',
    example: 1
  })
  completed: number | null;

  @ApiProperty({ 
    description: 'Error message if any',
    required: false
  })
  error?: string;
}