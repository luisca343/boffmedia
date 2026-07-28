import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TOURNAMENT_FORMAT,
  COMPETITOR_KIND,
  TOURNAMENT_METRIC,
} from '@/_db/schema/BoffMediaTournaments';
import type {
  TournamentFormat,
  CompetitorKind,
  TournamentMetric,
} from '../tournaments.types';
import { CreatePhaseDto } from './create-phase.dto';

export class CreateTournamentDto {
  @ApiProperty({ example: 'Copa Boffmedia Verano' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'URL slug; derived from the name when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ enum: Object.values(TOURNAMENT_FORMAT) })
  @IsEnum(TOURNAMENT_FORMAT)
  format: TournamentFormat;

  @ApiPropertyOptional({ enum: Object.values(COMPETITOR_KIND) })
  @IsOptional()
  @IsEnum(COMPETITOR_KIND)
  competitorKind?: CompetitorKind;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gameId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eventId?: number;

  @ApiPropertyOptional({ enum: Object.values(TOURNAMENT_METRIC) })
  @IsOptional()
  @IsEnum(TOURNAMENT_METRIC)
  metric?: TournamentMetric;

  @ApiPropertyOptional({ description: 'Leaderboard unit, e.g. "pts" or "s".' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  maxParticipants?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;

  @ApiPropertyOptional({ description: 'Games per match (BO1/BO3/BO5).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bestOf?: number;

  @ApiPropertyOptional({
    description:
      'Minutes a self-reported result waits for rival confirmation before ' +
      'auto-verifying. Null → the platform default (10).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  autoVerifyMinutes?: number;

  @ApiPropertyOptional({ description: 'Groups format: number of groups.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupCount?: number;

  @ApiPropertyOptional({ description: 'Advancers per group (groups format).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  advanceCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiPropertyOptional({ description: 'Prize breakdown (free text).' })
  @IsOptional()
  @IsString()
  prizes?: string;

  @ApiPropertyOptional({ description: 'Player check-in window open.' })
  @IsOptional()
  @IsBoolean()
  checkInOpen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  banner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hue?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    type: [CreatePhaseDto],
    description:
      'Ordered phases (array order = phase order). Omitted → a single phase is ' +
      'synthesized from `format` (full back-compat).',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePhaseDto)
  phases?: CreatePhaseDto[];
}
