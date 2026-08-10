import { ApiProperty } from '@nestjs/swagger';

/**
 * Which optional modules an event actually has. Derived from the satellite
 * tables that already key on `event_id` — never stored on the event row, so it
 * cannot drift from the thing it describes.
 */
export class EventModules {
  @ApiProperty({
    // Explicit `type`, same reason as `Event.packId`: swagger cannot infer a
    // nullable union and the generated client degrades to Record<string, any>.
    type: String,
    example: 'open',
    description:
      'Randomizer lifecycle, or null when the event has no randomizer. A `draft` config reads as null here: drafts are admin-only, so the public shape never reveals one.',
    enum: ['open', 'closed', 'published'],
    required: false,
    nullable: true,
  })
  randomizer: 'open' | 'closed' | 'published' | null;
}

export class Event {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the event',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Parent event ID if this is a sub-event',
    required: false,
  })
  parentId?: number;

  @ApiProperty({
    example: 'Summer Gaming Championship',
    description: 'Title of the event',
  })
  title: string;

  @ApiProperty({
    example: 'A competitive gaming event for the summer season',
    description: 'Description of the event',
  })
  description: string;

  @ApiProperty({
    example: 1,
    description: 'Game ID this event is for',
  })
  gameId: number;

  @ApiProperty({
    example: '/icons/event-icon.png',
    description: 'Event icon URL',
  })
  icon: string;

  @ApiProperty({
    example: '/banners/event-banner.jpg',
    description: 'Event banner URL',
    required: false,
  })
  banner?: string;

  @ApiProperty({
    example: '2024-07-01T00:00:00.000Z',
    description: 'Event start date',
  })
  startDate: Date;

  @ApiProperty({
    example: '2024-07-31T23:59:59.000Z',
    description: 'Event end date',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    example: 'upcoming',
    description: 'Event status',
    enum: ['upcoming', 'active', 'completed'],
  })
  status: 'upcoming' | 'active' | 'completed';

  @ApiProperty({
    example: 'public',
    description: 'Event visibility',
    enum: ['public', 'private'],
  })
  visibility: 'public' | 'private';

  @ApiProperty({
    example: 'event',
    description: 'Event type',
    enum: ['event', 'server'],
  })
  type: 'event' | 'server';

  @ApiProperty({
    // `type` is explicit: without it swagger cannot infer `string | null` and
    // the generated client model comes out as Record<string, any>.
    type: String,
    example: 'k3n8x1p0',
    description:
      'Pack this event grants access to. Membership in the event is the entitlement.',
    required: false,
    nullable: true,
  })
  packId?: string | null;

  @ApiProperty({
    example: 'Minecraft',
    description: 'Game name',
    required: false,
  })
  gameName?: string;

  @ApiProperty({
    example: 'Pixelmon Wingull 2',
    description: 'Name of the parent event',
    required: false,
  })
  parentEventName?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the event was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the event was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'When the event was deleted',
    required: false,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Child events if this is a parent event',
    type: [Event],
    required: false,
  })
  childEvents?: Event[];

  @ApiProperty({
    description:
      'Optional modules present on this event. Only populated by the single-event endpoint — the list endpoint omits it.',
    type: EventModules,
    required: false,
  })
  modules?: EventModules;
}
