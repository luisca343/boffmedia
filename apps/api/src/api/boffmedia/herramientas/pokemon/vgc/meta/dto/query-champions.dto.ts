import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryChampionsDto {
  @ApiProperty({ example: 'vgc2026regma', description: 'Champions regulation shorthand ID' })
  @IsString()
  @IsNotEmpty()
  regulationId: string;

  @ApiPropertyOptional({ description: 'Filter by tournament name (partial match)' })
  @IsOptional()
  @IsString()
  tournament?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Include entries on or after this date' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Include entries on or before this date' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
