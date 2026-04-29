import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryLimitlessDto {
  @ApiProperty({ example: 1, description: 'Internal tournament ID' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  tournamentId: number;

  @ApiPropertyOptional({ example: 50, description: 'Optional page size for usage endpoints' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Optional offset for usage endpoints' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
