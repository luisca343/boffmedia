import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  TOURNAMENT_FORMAT,
  TOURNAMENT_STATUS,
} from '@/_db/schema/BoffMediaTournaments';
import type { TournamentFormat, TournamentStatus } from '../tournaments.types';

/** Optional filters/pagination for `GET /tournaments`. */
export class ListTournamentsQueryDto {
  @ApiPropertyOptional({ enum: Object.values(TOURNAMENT_STATUS) })
  @IsOptional()
  @IsEnum(TOURNAMENT_STATUS)
  status?: TournamentStatus;

  @ApiPropertyOptional({ enum: Object.values(TOURNAMENT_FORMAT) })
  @IsOptional()
  @IsEnum(TOURNAMENT_FORMAT)
  format?: TournamentFormat;

  @ApiPropertyOptional({ description: 'Filter by game id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gameId?: number;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
