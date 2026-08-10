import { ApiProperty } from '@nestjs/swagger';

export class EventAchievement {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the achievement',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Event ID this achievement belongs to',
  })
  eventId: number;

  @ApiProperty({
    example: 'First Kill',
    description: 'Name of the achievement',
  })
  name: string;

  @ApiProperty({
    example: 'Get your first kill in the game',
    description: 'Description of the achievement',
  })
  description: string;

  @ApiProperty({
    example: '/icons/first-kill.png',
    description: 'Icon path for the achievement',
  })
  icon: string;

  @ApiProperty({
    example: 100,
    description: 'Points awarded for this achievement',
  })
  points: number;

  @ApiProperty({
    example: 1,
    description: 'Maximum progress needed to complete achievement',
  })
  maxProgress: number;

  @ApiProperty({
    example: 'achievement',
    description: 'Type of item',
    enum: ['achievement', 'medal'],
    required: false,
  })
  itemType?: 'achievement' | 'medal';

  @ApiProperty({
    example: 'achievement',
    description: 'Category of the achievement',
    enum: ['competition', 'challenge', 'participation', 'achievement'],
    required: false,
  })
  category?: 'competition' | 'challenge' | 'participation' | 'achievement';

  @ApiProperty({
    example: 'bronze',
    description: 'Rarity of the achievement',
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    required: false,
  })
  rarity?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  @ApiProperty({
    example: 1,
    description: 'Display order',
    required: false,
  })
  order?: number;

  @ApiProperty({
    example: 1,
    description: 'Whether the achievement is active',
    required: false,
  })
  active?: number;

  @ApiProperty({
    example: 'Summer Gaming Championship',
    description: 'Name of the event this achievement belongs to',
    required: false,
  })
  eventName?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the achievement was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the achievement was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'When the achievement was deleted',
    required: false,
  })
  deletedAt?: Date;
}
