import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';

export class CreateEventAchievementDto {
  @ApiProperty({
    description: 'The name of the achievement',
    example: 'First Kill',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'The description of the achievement',
    example: 'Get your first kill in the game',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The icon path',
    example: '/icons/first-kill.png',
  })
  @IsString()
  @MaxLength(500)
  icon: string;

  @ApiProperty({
    description: 'Points awarded for this achievement',
    example: 100,
  })
  @IsInt()
  @Min(0)
  points: number;

  @ApiProperty({
    description: 'Maximum progress needed to complete achievement',
    example: 1,
  })
  @IsInt()
  @Min(1)
  maxProgress: number;

  // Required: both columns are NOT NULL with no default, so an omitted value
  // used to die as a 500 on insert instead of a 400 here.
  @ApiProperty({
    description: 'Type of item',
    enum: ['achievement', 'medal'],
    example: 'achievement',
  })
  @IsEnum(['achievement', 'medal'])
  itemType: 'achievement' | 'medal';

  @ApiProperty({
    description: 'Category of the achievement',
    enum: ['competition', 'challenge', 'participation', 'achievement'],
    example: 'achievement',
  })
  @IsEnum(['competition', 'challenge', 'participation', 'achievement'])
  category: 'competition' | 'challenge' | 'participation' | 'achievement';

  @ApiProperty({
    description: 'Rarity of the achievement',
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    example: 'bronze',
    required: false,
  })
  @IsOptional()
  @IsEnum(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
  rarity?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  @ApiProperty({
    description: 'Display order',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  order?: number;
}
