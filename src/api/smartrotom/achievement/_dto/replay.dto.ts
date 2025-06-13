import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsInt, Min, IsUUID } from 'class-validator';

export class CreateReplayDto {
  @ApiProperty({ 
    description: 'Player 1 name',
    example: 'PlayerOne'
  })
  @IsNotEmpty()
  @IsString()
  side1: string;

  @ApiProperty({ 
    description: 'Player 2 name',
    example: 'PlayerTwo'
  })
  @IsNotEmpty()
  @IsString()
  side2: string;

  @ApiProperty({ 
    description: 'Player 1 team data (JSON string)',
    example: '{"pokemon": ["pikachu", "charizard"]}'
  })
  @IsNotEmpty()
  @IsString()
  team1: string;

  @ApiProperty({ 
    description: 'Player 2 team data (JSON string)',
    example: '{"pokemon": ["blastoise", "venusaur"]}'
  })
  @IsNotEmpty()
  @IsString()
  team2: string;

  @ApiProperty({ 
    description: 'Battle replay data',
    example: 'replay-data-string'
  })
  @IsNotEmpty()
  @IsString()
  replay: string;

  @ApiProperty({ 
    description: 'Winner of the battle',
    example: 'PlayerOne'
  })
  @IsNotEmpty()
  @IsString()
  winner: string;
}

export class CreateUserReplayDto {
  @ApiProperty({ 
    description: 'Replay ID',
    example: 123
  })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  replayId: number;

  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Player side (1 or 2)',
    example: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  side: number;
}

export class GetReplayDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Replay ID',
    example: 123
  })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  replayId: number;
}

export class CreateReplayResponse {
  @ApiProperty({ 
    description: 'ID of the created replay',
    example: 123
  })
  replayId: number;
}

export class CreateUserReplayResponse {
  @ApiProperty({ 
    description: 'ID of the created user-replay relation',
    example: 456
  })
  relationId: number;
}