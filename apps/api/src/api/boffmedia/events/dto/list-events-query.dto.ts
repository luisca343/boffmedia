import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EVENT_STATUS } from '@/_db/schema/Events';

/**
 * Optional filters/pagination for `GET /events`. Every field is optional — with
 * no query params the endpoint returns the full event list (backward compatible).
 */
export class ListEventsQueryDto {
  @ApiPropertyOptional({
    enum: Object.values(EVENT_STATUS),
    description: 'Filter by event status',
  })
  @IsOptional()
  @IsEnum(EVENT_STATUS)
  status?: (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

  @ApiPropertyOptional({ description: 'Filter by game id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gameId?: number;

  @ApiPropertyOptional({
    enum: ['event', 'server'],
    description: 'Filter by event type',
  })
  @IsOptional()
  @IsEnum(['event', 'server'])
  type?: 'event' | 'server';

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description: 'Max events to return (pagination)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Number of events to skip (pagination)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
