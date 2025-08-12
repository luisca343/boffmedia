import { ApiProperty } from '@nestjs/swagger';

export class BattleReplay {
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

export class BattleConfig {
  @ApiProperty({ 
    example: 'Elite Four Champion', 
    description: 'Configuration name' 
  })
  name?: string;

  @ApiProperty({ 
    example: 'Final battle against the Elite Four Champion', 
    description: 'Configuration description' 
  })
  description?: string;

  @ApiProperty({ 
    example: 'hard', 
    description: 'Difficulty level' 
  })
  difficulty?: string;

  @ApiProperty({ 
    description: 'Pokemon team configuration',
    example: [
      {
        "species": "charizard",
        "level": 100,
        "moves": ["flamethrower", "dragon-claw", "earthquake", "roost"]
      }
    ]
  })
  pokemon?: any[];

  @ApiProperty({ 
    description: 'Rewards configuration',
    example: [
      {
        "type": "currency",
        "amount": 5000
      }
    ]
  })
  rewards?: any[];
}