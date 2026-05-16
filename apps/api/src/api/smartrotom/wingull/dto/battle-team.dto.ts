import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { PokemonW } from '../entities/pokemon-w-.entity';

export class CreateBattleTeamDto {
  @ApiProperty({
    example: 'My Champion Team',
    description: 'Name of the battle team',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A powerful team for competitive battles',
    description: 'Optional description of the team',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBattleTeamDto {
  @ApiProperty({
    example: 'b8c3f2a1-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
    description: 'Battle team UUID',
  })
  @IsString()
  uuid: string;

  @ApiProperty({
    example: 'b8c3f2a1-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
    description: 'Battle team ID',
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    example: 'Updated Team Name',
    description: 'Updated name of the battle team',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Updated team description',
    description: 'Updated description of the team',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 2,
    description: 'Team slot to update (0-5)',
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  teamSlot: number;

  @ApiProperty({
    example: { box: 1, position: 3 },
    description: 'Pokemon data or null for empty slot',
    required: false,
  })
  @IsOptional()
  pokemon?: any | null;
}

export class BattleTeamSlotDto {
  @ApiProperty({
    example: 'b8c3f2a1-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
    description: 'Battle team ID',
  })
  @IsString()
  teamId: string;

  @ApiProperty({
    example: 0,
    description: 'Position in team (0-5)',
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  position: number;

  @ApiProperty({
    example: { id: 'pokemon-uuid', name: 'Pikachu' },
    description: 'Pokemon data or null for empty slot',
    required: false,
  })
  @IsOptional()
  pokemon?: PokemonW | null;
}

export class BattleTeamResponseDto {
  @ApiProperty({
    example: 'b8c3f2a1-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
    description: 'Battle team ID',
  })
  id: string;

  @ApiProperty({
    example: 'My Champion Team',
    description: 'Name of the battle team',
  })
  name: string;

  @ApiProperty({
    example: 'A powerful team for competitive battles',
    description: 'Description of the team',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: [
      { id: 'pokemon-uuid-1', name: 'Pikachu' },
      { id: 'pokemon-uuid-2', name: 'Charizard' },
      null,
      null,
      null,
      null,
    ],
    description: 'Array of 6 Pokemon (or null for empty slots)',
  })
  pokemon: (any | null)[];

  @ApiProperty({
    example: true,
    description: 'Whether this team is currently active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2025-09-19T10:30:00Z',
    description: 'Creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-09-19T15:45:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: string;
}

export class BattleTeamDataResponseDto {
  @ApiProperty({
    type: [BattleTeamResponseDto],
    description: 'Array of battle teams',
  })
  teams: BattleTeamResponseDto[];

  @ApiProperty({ example: 10, description: 'Maximum number of teams allowed' })
  maxTeams: number;

  @ApiProperty({
    example: 'b8c3f2a1-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
    description: 'ID of the currently active team',
    required: false,
  })
  activeTeamId?: string;
}
