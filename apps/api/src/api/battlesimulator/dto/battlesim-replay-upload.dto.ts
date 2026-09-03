import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { BATTLESIM_REPLAY_SOURCES } from '@/_db/schema/Battlesim';

export class BattlesimReplayUploadDto {
  @ApiProperty({
    description: 'Client-generated id for idempotent uploads',
    example: 'local-replay-123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  clientId: string;

  @ApiProperty({
    description: 'Battle format (e.g., gen9randomdoublesbattle)',
    example: 'gen9randombattle',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  format: string;

  @ApiProperty({
    description: 'Player 1 name',
    example: 'Player1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  p1Name: string;

  @ApiProperty({
    description: 'Player 2 name',
    example: 'Player2',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  p2Name: string;

  @ApiProperty({
    description: 'Winner name (null for draw)',
    example: 'Player1',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  winner?: string;

  @ApiProperty({
    description:
      'Protocol log (battle transcript). Must not exceed ~8 MB (MEDIUMTEXT limit)',
  })
  @IsString()
  @IsNotEmpty()
  log: string;

  @ApiProperty({
    description: 'Team snapshots as JSON string',
    example: '{"p1":[],"p2":[]}',
    required: false,
  })
  @IsString()
  @IsOptional()
  teams?: string;

  @ApiProperty({
    description: 'Battle source',
    example: 'local',
    enum: BATTLESIM_REPLAY_SOURCES,
  })
  @IsEnum(BATTLESIM_REPLAY_SOURCES)
  source: (typeof BATTLESIM_REPLAY_SOURCES)[number];

  @ApiProperty({
    description: 'When the battle was played (epoch ms)',
    example: 1693574400000,
  })
  @IsNumber()
  @IsNotEmpty()
  playedAt: number;
}
