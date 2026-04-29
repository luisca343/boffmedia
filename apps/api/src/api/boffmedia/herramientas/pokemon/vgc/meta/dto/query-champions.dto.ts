import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryChampionsDto {
  @ApiProperty({ example: 'vgc2026regma', description: 'Champions regulation shorthand ID' })
  @IsString()
  @IsNotEmpty()
  regulationId: string;

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
