import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateBattleConfigDto {
  @ApiProperty({ 
    description: 'Configuration name',
    example: 'Elite Four Champion'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Configuration description',
    example: 'Final battle against the Elite Four Champion'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Difficulty level',
    example: 'hard'
  })
  @IsOptional()
  @IsString()
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
  @IsOptional()
  @IsArray()
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
  @IsOptional()
  @IsArray()
  rewards?: any[];
}

export class UpdateBattleConfigDto {
  @ApiProperty({ 
    description: 'Configuration name',
    example: 'Elite Four Champion - Updated',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Configuration description',
    example: 'Updated final battle against the Elite Four Champion',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Difficulty level',
    example: 'extreme',
    required: false
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiProperty({ 
    description: 'Pokemon team configuration',
    example: [
      {
        "species": "mewtwo",
        "level": 100,
        "moves": ["psychic", "recover", "shadow-ball", "focus-blast"]
      }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  pokemon?: any[];

  @ApiProperty({ 
    description: 'Rewards configuration',
    example: [
      {
        "type": "currency",
        "amount": 10000
      }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  rewards?: any[];
}

export class GetBattleConfigDto {
  @ApiProperty({ 
    description: 'NPC configuration name',
    example: 'gym-leader-brock'
  })
  @IsString()
  @IsNotEmpty()
  npcConfigName: string;
}