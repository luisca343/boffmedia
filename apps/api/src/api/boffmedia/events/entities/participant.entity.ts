import { ApiProperty } from '@nestjs/swagger';

export class Participant {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the participant',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Event ID',
  })
  eventId: number;

  @ApiProperty({
    example: 1,
    description: 'Participant ID',
  })
  participantId: number;

  @ApiProperty({
    example: 1,
    description: 'User ID',
  })
  userId: number;

  @ApiProperty({
    example: '/avatars/john.png',
    description: 'User avatar URL',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    example: 'JohnTheGamer',
    description: 'Participant nickname in the event',
    required: false,
  })
  nickname?: string;

  @ApiProperty({
    example: 'registered',
    description: 'Participant status',
    enum: ['registered', 'confirmed', 'declined', 'removed'],
  })
  status: 'registered' | 'confirmed' | 'declined' | 'removed';

  @ApiProperty({
    example: 'Looking forward to the event!',
    description: 'Comment from participant',
    required: false,
  })
  comment?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the participant was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the participant was last updated',
  })
  updatedAt: Date;
}
