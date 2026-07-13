import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// The web app's paged envelope names the field `pageSize` (it's what the response already
// returns) and every list call site sends `pageSize` on the wire. `limit` is kept as a
// deprecated alias so nothing already using it breaks.
// The ceiling is 500, not the usual 100: several registers (parcelas on the map, the
// treasury's fine list, the audit log) legitimately pull one generous page rather than
// paginate, and a 100-row cap would 400 them. It is still a cap — nothing may ask for
// the whole table.
const MAX_PAGE_SIZE = 500;

export class PagedQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    deprecated: true,
    description: 'Alias for pageSize',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}

export function resolvePageSize(
  query: { pageSize?: number; limit?: number },
  fallback = 20,
): number {
  return query.pageSize ?? query.limit ?? fallback;
}
