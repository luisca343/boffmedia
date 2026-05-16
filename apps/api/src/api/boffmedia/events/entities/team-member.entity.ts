import { ApiProperty } from '@nestjs/swagger';

export class TeamMember {
  @ApiProperty({
    example: 1,
    description: 'User ID',
  })
  userId: number;

  @ApiProperty({
    example: 1,
    description: 'Team ID',
  })
  teamId: number;

  @ApiProperty({
    example: 1,
    description: 'Participant ID',
  })
  participantId: number;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Display name',
  })
  displayName: string;

  @ApiProperty({
    example: '/avatars/john.png',
    description: 'User avatar URL',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    example: 'leader',
    description: 'Member role in the team',
    enum: ['leader', 'member'],
  })
  role: 'leader' | 'member';

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the user joined the team',
  })
  joinedAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the team member was last updated',
  })
  updatedAt: Date;
}
