import { ApiProperty } from '@nestjs/swagger';

export class Replay {
  @ApiProperty({ 
    example: 123, 
    description: 'Unique identifier for the replay' 
  })
  id: number;

  @ApiProperty({ 
    example: 'PlayerOne', 
    description: 'Player 1 name' 
  })
  side1: string;

  @ApiProperty({ 
    example: 'PlayerTwo', 
    description: 'Player 2 name' 
  })
  side2: string;

  @ApiProperty({ 
    example: '{"pokemon": ["pikachu", "charizard"]}', 
    description: 'Player 1 team data' 
  })
  team1: string;

  @ApiProperty({ 
    example: '{"pokemon": ["blastoise", "venusaur"]}', 
    description: 'Player 2 team data' 
  })
  team2: string;

  @ApiProperty({ 
    example: 'replay-data-string', 
    description: 'Battle replay data' 
  })
  replay: string;

  @ApiProperty({ 
    example: 'PlayerOne', 
    description: 'Winner of the battle' 
  })
  winner: string;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'When the replay was created' 
  })
  date: Date;
}

export class UserReplay {
  @ApiProperty({ 
    example: 456, 
    description: 'Unique identifier for the user-replay relation' 
  })
  id: number;

  @ApiProperty({ 
    example: 123, 
    description: 'Replay ID' 
  })
  replayId: number;

  @ApiProperty({ 
    example: '007d1a64-661c-4396-8844-e27856f2ddfa', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Player side (1 or 2)' 
  })
  side: number;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'When the relation was created' 
  })
  createdAt: Date;
}