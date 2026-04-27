import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SMOGON_VALID_CUTOFFS } from '../config/smogon.config';

export class FetchSmogonDto {
  @ApiProperty({ example: 'gen9vgc2026regi', description: 'Showdown format ID' })
  @IsString()
  @IsNotEmpty()
  format: string;

  @ApiProperty({ example: '2026-03', description: 'Month in YYYY-MM format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month: string;

  @ApiPropertyOptional({ enum: SMOGON_VALID_CUTOFFS, default: 1760 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(SMOGON_VALID_CUTOFFS)
  cutoff?: number;
}
