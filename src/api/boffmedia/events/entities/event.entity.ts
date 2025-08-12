import { ApiProperty } from '@nestjs/swagger';

export class Event {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the event' 
  })
  id: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Parent event ID if this is a sub-event',
    required: false 
  })
  parentId?: number;

  @ApiProperty({ 
    example: 'Summer Gaming Championship', 
    description: 'Title of the event' 
  })
  title: string;

  @ApiProperty({ 
    example: 'A competitive gaming event for the summer season', 
    description: 'Description of the event' 
  })
  description: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Game ID this event is for' 
  })
  gameId: number;

  @ApiProperty({ 
    example: '/icons/event-icon.png', 
    description: 'Event icon URL' 
  })
  icon: string;

  @ApiProperty({ 
    example: '/banners/event-banner.jpg', 
    description: 'Event banner URL',
    required: false 
  })
  banner?: string;

  @ApiProperty({ 
    example: '2024-07-01T00:00:00.000Z', 
    description: 'Event start date' 
  })
  startDate: Date;

  @ApiProperty({ 
    example: '2024-07-31T23:59:59.000Z', 
    description: 'Event end date',
    required: false 
  })
  endDate?: Date;

  @ApiProperty({ 
    example: 'upcoming', 
    description: 'Event status',
    enum: ['upcoming', 'active', 'completed']
  })
  status: 'upcoming' | 'active' | 'completed';

  @ApiProperty({ 
    example: 'public', 
    description: 'Event visibility',
    enum: ['public', 'private']
  })
  visibility: 'public' | 'private';

  @ApiProperty({ 
    example: 'event', 
    description: 'Event type',
    enum: ['event', 'server']
  })
  type: 'event' | 'server';

  @ApiProperty({ 
    example: 'Minecraft', 
    description: 'Game name',
    required: false 
  })
  gameName?: string;

  @ApiProperty({
    example: 'Pixelmon Wingull 2',
    description: 'Name of the parent event',
    required: false
  })
  parentEventName?: string;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00.000Z', 
    description: 'When the event was created' 
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00.000Z', 
    description: 'When the event was last updated' 
  })
  updatedAt: Date;

  @ApiProperty({ 
    example: null, 
    description: 'When the event was deleted',
    required: false 
  })
  deletedAt?: Date;

  @ApiProperty({ 
    description: 'Child events if this is a parent event',
    type: [Event],
    required: false 
  })
  childEvents?: Event[];
}