import { ApiProperty } from '@nestjs/swagger';

export class UserTrophyEntity {
  @ApiProperty({ example: 1, description: 'Achievement/medal ID' })
  id: number;

  @ApiProperty({ example: 'First Steps', description: 'Trophy name' })
  name: string;

  @ApiProperty({
    example: 'Join your first event',
    description: 'Trophy description',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: 'trophy.png', description: 'Trophy icon' })
  icon: string;

  @ApiProperty({ example: 10, description: 'Points awarded for this trophy' })
  points: number;

  @ApiProperty({
    example: 'common',
    description: 'Trophy rarity',
    type: String,
    nullable: true,
  })
  rarity: string | null;

  @ApiProperty({
    example: 'achievement',
    description: 'Whether this is an achievement or a medal',
    enum: ['achievement', 'medal'],
  })
  itemType: 'achievement' | 'medal';

  @ApiProperty({ example: 'events', description: 'Trophy category' })
  category: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user has earned this trophy',
  })
  earned: boolean;

  @ApiProperty({
    example: '2025-06-28T10:00:00.000Z',
    description: 'When the user completed this trophy, if earned',
    type: String,
    nullable: true,
  })
  completedAt: string | null;
}

export class UserTrophiesEntity {
  @ApiProperty({ example: 5, description: 'Number of trophies earned' })
  earnedCount: number;

  @ApiProperty({ example: 20, description: 'Total number of trophies' })
  totalCount: number;

  @ApiProperty({ type: UserTrophyEntity, isArray: true })
  trophies: UserTrophyEntity[];
}

export class UserActivityItemEntity {
  @ApiProperty({
    example: 'achievement',
    description: 'Type of activity entry',
    enum: ['achievement', 'event_join'],
  })
  type: 'achievement' | 'event_join';

  @ApiProperty({ example: 'First Steps', description: 'Achievement or event name' })
  name: string;

  @ApiProperty({ example: 'trophy.png', description: 'Icon for this activity' })
  icon: string;

  @ApiProperty({
    example: 10,
    description: 'Points earned (achievements only)',
    type: Number,
    nullable: true,
  })
  points: number | null;

  @ApiProperty({
    example: '2025-06-28T10:00:00.000Z',
    description: 'Timestamp of the activity',
  })
  at: string;
}
