import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsBoolean, IsObject } from 'class-validator';

export class BattleAchievementDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Achievement ID to unlock',
    example: 'first_battle_win'
  })
  @IsNotEmpty()
  @IsString()
  logro: string;

  @ApiProperty({ 
    description: 'Player 1 name',
    example: 'PlayerOne'
  })
  @IsNotEmpty()
  @IsString()
  name1: string;

  @ApiProperty({ 
    description: 'Player 2 name',
    example: 'PlayerTwo'
  })
  @IsNotEmpty()
  @IsString()
  name2: string;

  @ApiProperty({ 
    description: 'Player 1 team data',
    example: { pokemon: ['pikachu', 'charizard'] }
  })
  @IsNotEmpty()
  @IsObject()
  team1: any;

  @ApiProperty({ 
    description: 'Player 2 team data',
    example: { pokemon: ['blastoise', 'venusaur'] }
  })
  @IsNotEmpty()
  @IsObject()
  team2: any;

  @ApiProperty({ 
    description: 'Battle replay data',
    example: 'replay-data-string'
  })
  @IsNotEmpty()
  @IsString()
  replay: string;

  @ApiProperty({ 
    description: 'Whether the player won the battle',
    example: true
  })
  @IsNotEmpty()
  @IsBoolean()
  victoria: boolean;
}

export class BattleAchievementResponse {
  @ApiProperty({ 
    description: 'Whether the operation was successful',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Error message if operation failed',
    required: false
  })
  error?: string;

  @ApiProperty({ 
    description: 'ID of the created replay',
    required: false,
    example: 123
  })
  replayId?: number;
}