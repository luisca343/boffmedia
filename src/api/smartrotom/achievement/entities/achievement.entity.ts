import { ApiProperty } from '@nestjs/swagger';

export class Achievement {
  @ApiProperty({ 
    example: 'first_battle_win', 
    description: 'Unique identifier for the achievement' 
  })
  id: string;

  @ApiProperty({ 
    example: 'First Battle Victory', 
    description: 'Achievement name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'Win your first battle against another player', 
    description: 'Achievement description' 
  })
  description: string;

  @ApiProperty({ 
    example: '/icons/achievements/first_win.png', 
    description: 'Achievement icon path' 
  })
  icon: string;

  @ApiProperty({ 
    example: 'battle', 
    description: 'Achievement category' 
  })
  category: string;

  @ApiProperty({ 
    example: 'pvp', 
    description: 'Achievement subcategory' 
  })
  subcategory: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Target value to complete the achievement' 
  })
  target: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Display order' 
  })
  order: number;
}

export class UserAchievement extends Achievement {
  @ApiProperty({ 
    example: 123, 
    description: 'Battle/Data ID associated with this achievement' 
  })
  battleId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Current progress towards the achievement' 
  })
  progress: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Completion status (0 = not completed, 1 = completed)' 
  })
  completed: number;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'When the achievement was completed' 
  })
  completedAt: Date;

  @ApiProperty({ 
    example: '007d1a64-661c-4396-8844-e27856f2ddfa', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: '{"pokemon": ["pikachu", "charizard"]}', 
    description: 'Team data used for the achievement' 
  })
  team: string;

  @ApiProperty({ 
    example: 'replay-data-string', 
    description: 'Battle replay data' 
  })
  replay: string;
}