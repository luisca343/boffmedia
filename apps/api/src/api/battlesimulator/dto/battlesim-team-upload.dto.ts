import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  MaxLength,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { BSIM_FORMAT_IDS } from '../_utils/formats';

export class BattlesimTeamUploadDto {
  @ApiProperty({
    description: 'Client-generated id for idempotent uploads',
    example: 'team-123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  clientId: string;

  @ApiProperty({
    description: 'Team name',
    example: 'VGC 2026 Flyer',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({
    description:
      'Battle format. Must be a registered id from battle-core BSIM_FORMATS.',
    example: 'gen9vgc2025regi',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  // A team is only ever useful in a format the simulator can start; storing one
  // under an unknown id just defers the failure to the day it is loaded.
  @IsIn(BSIM_FORMAT_IDS)
  format: string;

  @ApiProperty({
    description: 'Team in Showdown packed format',
    example: 'Pikachu|...|move1|move2|move3|move4',
  })
  @IsString()
  @IsNotEmpty()
  packed: string;

  @ApiProperty({
    description: 'User-defined tags for organizing teams',
    example: ['competitive', 'doubles'],
    required: false,
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description:
      "Client's last update timestamp (epoch ms) for merge conflict resolution",
    example: 1693574400000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clientUpdatedAt?: number;

  @ApiProperty({
    description:
      'Tombstone timestamp (epoch ms) if this is a deletion, null otherwise',
    example: 1693574400000,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  deletedAt?: number | null;
}
