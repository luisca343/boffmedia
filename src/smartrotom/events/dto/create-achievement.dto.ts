import { ApiProperty } from '@nestjs/swagger';

export class CreateAchievementDto {
  @ApiProperty({ description: 'The name of the achievement' })
  name: string;

  @ApiProperty({ description: 'The description of the achievement' })
  description: string;

  @ApiProperty({ description: 'The icon path' })
  icon: string;

  @ApiProperty({ description: 'The points awarded for completion' })
  points: number;

  @ApiProperty({ 
    description: 'Category of the achievement',
    enum: ['competition', 'challenge', 'participation', 'achievement']
  })
  category: 'competition' | 'challenge' | 'participation' | 'achievement';

  @ApiProperty({ 
    description: 'The rarity of the achievement',
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  })
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  @ApiProperty({ description: 'Maximum progress needed to complete', default: 1 })
  maxProgress?: number;

  @ApiProperty({ description: 'Display order in listings', required: false })
  order?: number;
}