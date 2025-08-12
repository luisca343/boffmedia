import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, MaxLength, IsEnum } from 'class-validator';

export class CreateAchievementDto {
  @ApiProperty({ 
    description: 'The name of the achievement',
    example: 'First Kill'
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ 
    description: 'The description of the achievement',
    example: 'Get your first kill in the game'
  })
  @IsString()
  description: string;

  @ApiProperty({ 
    description: 'The icon path',
    example: '/icons/first-kill.png'
  })
  @IsString()
  @MaxLength(500)
  icon: string;

  @ApiProperty({ 
    description: 'Points awarded for this achievement',
    example: 100
  })
  @IsInt()
  @Min(0)
  points: number;

  @ApiProperty({ 
    description: 'Maximum progress needed to complete achievement',
    example: 1
  })
  @IsInt()
  @Min(1)
  maxProgress: number;

  @ApiProperty({ 
    description: 'Type of item',
    enum: ['achievement', 'medal'],
    example: 'achievement',
    required: false
  })
  @IsOptional()
  @IsEnum(['achievement', 'medal'])
  itemType?: 'achievement' | 'medal';

  @ApiProperty({ 
    description: 'Category of the achievement',
    enum: ['competition', 'challenge', 'participation', 'achievement'],
    example: 'achievement',
    required: false
  })
  @IsOptional()
  @IsEnum(['competition', 'challenge', 'participation'])
  category?: 'competition' | 'challenge' | 'participation';

  @ApiProperty({ 
    description: 'Rarity of the achievement',
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    example: 'bronze',
    required: false
  })
  @IsOptional()
  @IsEnum(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
  rarity?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  @ApiProperty({ 
    description: 'Display order',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ 
    description: 'Whether the achievement is active',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  active?: number;
}