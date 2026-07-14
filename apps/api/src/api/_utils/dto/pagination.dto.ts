import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Reusable, bounded pagination for list query params. Use with
 * `@Query() q: PaginationQueryDto` on a controller whose global ValidationPipe
 * has `transform: true` so the raw strings are coerced to numbers and clamped.
 * `limit` is capped at 100 to protect the DB from unbounded scans.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Max results to return', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Rows to skip', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
