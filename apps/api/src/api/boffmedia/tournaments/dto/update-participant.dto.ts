import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TOURNAMENT_PARTICIPANT_STATUS } from '@/_db/schema/Tournaments';
import type { ParticipantStatus } from '../tournaments.types';

export class UpdateParticipantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hue?: number;

  @ApiPropertyOptional({ description: 'Leaderboard score.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Assign to a group (groups format).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groupId?: number;

  @ApiPropertyOptional({ enum: Object.values(TOURNAMENT_PARTICIPANT_STATUS) })
  @IsOptional()
  @IsEnum(TOURNAMENT_PARTICIPANT_STATUS)
  status?: ParticipantStatus;
}
