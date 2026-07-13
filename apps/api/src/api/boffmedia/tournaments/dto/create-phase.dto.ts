import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PHASE_FORMAT,
  ADVANCE_TYPE,
  TIEBREAK_PROFILE,
} from '@/_db/schema/Tournaments';
import type {
  PhaseFormat,
  AdvanceType,
  TiebreakProfile,
} from '../tournaments.types';

/** One phase in a tournament's ordered phase list. */
export class CreatePhaseDto {
  @ApiProperty({ example: 'Día 1 — Suizo' })
  @IsString()
  @MaxLength(128)
  name: string;

  @ApiProperty({ enum: Object.values(PHASE_FORMAT) })
  @IsEnum(PHASE_FORMAT)
  format: PhaseFormat;

  @ApiPropertyOptional({
    description: 'Games per match; falls back to tournament.bestOf.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bestOf?: number;

  @ApiPropertyOptional({
    description:
      'Best-of override for the decisive match (single: final · double: grand final).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  finalsBestOf?: number;

  @ApiPropertyOptional({ description: 'Swiss: fixed number of rounds.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rounds?: number;

  @ApiPropertyOptional({ description: 'Groups: number of groups.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupCount?: number;

  @ApiPropertyOptional({
    description:
      'Single: also play a third-place match between semifinal losers.',
  })
  @IsOptional()
  @IsBoolean()
  thirdPlace?: boolean;

  @ApiPropertyOptional({
    description: 'Fold the previous phase records into this phase.',
  })
  @IsOptional()
  @IsBoolean()
  carryStandings?: boolean;

  @ApiPropertyOptional({
    enum: Object.values(ADVANCE_TYPE),
    description: 'Null on the final phase.',
  })
  @IsOptional()
  @IsEnum(ADVANCE_TYPE)
  advanceType?: AdvanceType;

  @ApiPropertyOptional({
    description: 'top_n: N · record: optional cap by standings order.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  advanceCount?: number;

  @ApiPropertyOptional({
    description: 'record: max losses to advance (2 → "X-2 or better").',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  advanceMaxLosses?: number;

  @ApiPropertyOptional({ enum: Object.values(TIEBREAK_PROFILE) })
  @IsOptional()
  @IsEnum(TIEBREAK_PROFILE)
  tiebreakProfile?: TiebreakProfile;

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
}

/** Editing a still-pending phase — every field optional. */
export class UpdatePhaseDto extends CreatePhaseDto {
  @ApiPropertyOptional({ example: 'Día 1 — Suizo' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  declare name: string;

  @ApiPropertyOptional({ enum: Object.values(PHASE_FORMAT) })
  @IsOptional()
  @IsEnum(PHASE_FORMAT)
  declare format: PhaseFormat;
}
