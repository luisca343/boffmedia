import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDivergenceDto {
  @ApiProperty({ description: 'Regulation ID', example: 'vgc2026regma' })
  @IsString()
  regulationId: string;

  @ApiPropertyOptional({
    description: 'Limitless tournament ID; omit for combined across all completed tournaments in the regulation',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tournamentId?: number;

  @ApiPropertyOptional({
    description: 'Smogon month (YYYY-MM); defaults to the most recent cached snapshot',
    example: '2026-03',
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: 'Smogon ELO cutoff (0 / 1500 / 1630 / 1760); defaults to 1760',
    example: 1760,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  cutoff?: number;
}
