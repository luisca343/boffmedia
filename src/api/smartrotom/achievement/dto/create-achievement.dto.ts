import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateAchievementDto extends BaseDto {
  @ApiProperty({ 
    description: 'Achievement unique identifier',
    example: 'medalla_denki'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  id: string;

  @ApiProperty({ 
    description: 'Achievement name',
    example: 'Medalla Denki'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiProperty({ 
    description: 'Achievement description',
    example: 'Win your first battle against another player'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ 
    description: 'Achievement icon URL',
    example: 'https://example.com/icon.png',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiProperty({ 
    description: 'Achievement category',
    example: 'battle'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  category: string;

  @ApiProperty({ 
    description: 'Achievement subcategory',
    example: 'pvp',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  subcategory?: string;

  @ApiProperty({ 
    description: 'Target value to complete achievement',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  target?: number;

  @ApiProperty({ 
    description: 'Display order',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}