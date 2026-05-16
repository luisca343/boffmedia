import { ApiProperty } from '@nestjs/swagger';

export class CreateMedalDto {
  @ApiProperty({ description: 'The name of the medal' })
  name: string;

  @ApiProperty({ description: 'The description of the medal' })
  description: string;

  @ApiProperty({ description: 'The icon URL for the medal' })
  icon: string;

  @ApiProperty({ description: 'Points awarded for this medal' })
  points: number;

  @ApiProperty({ description: 'Category of the medal' })
  category: 'placement' | 'challenge' | 'participation' | 'team_achievement';

  @ApiProperty({
    description: 'Placement position (for placement medals)',
    required: false,
  })
  placement?: number;

  @ApiProperty({ description: 'Maximum progress needed' })
  maxProgress: number;

  @ApiProperty({ description: 'Display order' })
  order: number;

  @ApiProperty({ description: 'Whether this is a team medal' })
  isTeamMedal: boolean;
}
