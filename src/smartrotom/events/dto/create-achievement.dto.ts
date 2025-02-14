import { ApiProperty } from '@nestjs/swagger';

export class CreateAchievementDto {
  @ApiProperty({ description: 'The title of the achievement' })
  title: string;

  @ApiProperty({ description: 'The description of the achievement' })
  description: string;

  @ApiProperty({ description: 'The icon path' })
  icon: string;

  @ApiProperty({ description: 'The target progress needed' })
  target: number;

  @ApiProperty({ description: 'The rarity of the achievement' })
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  @ApiProperty({ description: 'The points awarded for completion' })
  points: number;
}