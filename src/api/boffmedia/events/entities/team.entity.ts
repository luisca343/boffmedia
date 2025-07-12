import { ApiProperty } from '@nestjs/swagger';

export class Team {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the team' 
  })
  id: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Event ID this team belongs to' 
  })
  eventId: number;

  @ApiProperty({ 
    example: 'Team Alpha', 
    description: 'Name of the team' 
  })
  name: string;

  @ApiProperty({ 
    example: 'ALPH', 
    description: 'Team tag/code',
    required: false 
  })
  tag?: string;

  @ApiProperty({ 
    example: '/icons/team-alpha.png', 
    description: 'Team icon URL',
    required: false 
  })
  icon?: string;

  @ApiProperty({ 
    example: 'active', 
    description: 'Team status',
    enum: ['active', 'disqualified', 'withdrew'],
    required: false 
  })
  status?: 'active' | 'disqualified' | 'withdrew';

  @ApiProperty({ 
    example: 750, 
    description: 'Total team score',
    required: false 
  })
  totalScore?: number;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00.000Z', 
    description: 'When the team was created' 
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00.000Z', 
    description: 'When the team was last updated' 
  })
  updatedAt: Date;

  @ApiProperty({ 
    example: null, 
    description: 'When the team was deleted',
    required: false 
  })
  deletedAt?: Date;
}