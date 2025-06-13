import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateReplayDto {
  @ApiProperty({ 
    description: 'Player 1 name',
    example: 'PlayerOne'
  })
  @IsString()
  @IsNotEmpty()
  side1: string;

  @ApiProperty({ 
    description: 'Player 2 name',
    example: 'PlayerTwo'
  })
  @IsString()
  @IsNotEmpty()
  side2: string;

  @ApiProperty({ 
    description: 'Player 1 team data (JSON string)',
    example: '{"pokemon": ["pikachu", "charizard"]}'
  })
  @IsString()
  @IsNotEmpty()
  team1: string;

  @ApiProperty({ 
    description: 'Player 2 team data (JSON string)',
    example: '{"pokemon": ["blastoise", "venusaur"]}'
  })
  @IsString()
  @IsNotEmpty()
  team2: string;

  @ApiProperty({ 
    description: 'Battle replay data',
    example: 'replay-data-string'
  })
  @IsString()
  @IsNotEmpty()
  replay: string;

  @ApiProperty({ 
    description: 'Winner of the battle',
    example: 'PlayerOne'
  })
  @IsString()
  @IsNotEmpty()
  winner: string;

  @ApiProperty({ 
    description: 'User UUID to associate with this replay',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userUuid: string;
}

export class UpdateReplayDto {
  @ApiProperty({ 
    description: 'Player 1 name',
    example: 'PlayerOne',
    required: false
  })
  @IsOptional()
  @IsString()
  side1?: string;

  @ApiProperty({ 
    description: 'Player 2 name',
    example: 'PlayerTwo',
    required: false
  })
  @IsOptional()
  @IsString()
  side2?: string;

  @ApiProperty({ 
    description: 'Player 1 team data (JSON string)',
    example: '{"pokemon": ["pikachu", "charizard"]}',
    required: false
  })
  @IsOptional()
  @IsString()
  team1?: string;

  @ApiProperty({ 
    description: 'Player 2 team data (JSON string)',
    example: '{"pokemon": ["blastoise", "venusaur"]}',
    required: false
  })
  @IsOptional()
  @IsString()
  team2?: string;

  @ApiProperty({ 
    description: 'Battle replay data',
    example: 'replay-data-string',
    required: false
  })
  @IsOptional()
  @IsString()
  replay?: string;

  @ApiProperty({ 
    description: 'Winner of the battle',
    example: 'PlayerOne',
    required: false
  })
  @IsOptional()
  @IsString()
  winner?: string;
}

export class GetUserReplaysDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  uuid: string;
}

export class GetReplayByIdDto {
  @ApiProperty({ 
    description: 'Replay ID',
    example: 123
  })
  @IsNotEmpty()
  replayId: number;

  @ApiProperty({ 
    description: 'Player UUID for access validation',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  uuid?: string;
}

export class ShareReplayDto {
  @ApiProperty({ 
    description: 'Target player UUID to share with',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  targetUuid: string;

  @ApiProperty({ 
    description: 'Source player UUID (optional for validation)',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  sourceUuid?: string;
}