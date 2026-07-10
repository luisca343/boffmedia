import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export const THREAD_SORT = ['recent', 'top', 'new'] as const;
export type ThreadSort = (typeof THREAD_SORT)[number];

export class ListThreadsQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Page number (1-based)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 20,
    description: 'Threads per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: THREAD_SORT,
    default: 'recent',
    description:
      'recent = last activity desc (nulls last) then createdAt desc; top = votes desc; new = createdAt desc. Pinned threads always come first.',
  })
  @IsOptional()
  @IsEnum(THREAD_SORT)
  sort?: ThreadSort = 'recent';
}
