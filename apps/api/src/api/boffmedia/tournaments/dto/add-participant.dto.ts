import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { COMPETITOR_KIND } from '@/_db/schema/BoffMediaTournaments';
import type { CompetitorKind } from '../tournaments.types';

export class RosterMemberDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  role?: string;
}

/** Admin adds an entrant. `name` is the display name (team name for teams). */
export class AddParticipantDto {
  @ApiPropertyOptional({ enum: Object.values(COMPETITOR_KIND) })
  @IsOptional()
  @IsEnum(COMPETITOR_KIND)
  kind?: CompetitorKind;

  @ApiPropertyOptional({ description: 'Linked user id (solo competitors).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  tag?: string;

  @ApiPropertyOptional({ description: 'ISO alpha-2 country code.' })
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

  @ApiPropertyOptional({ description: 'Leaderboard-format score.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  score?: number;

  @ApiPropertyOptional({ description: 'Leaderboard meta line.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ type: [RosterMemberDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RosterMemberDto)
  roster?: RosterMemberDto[];
}
