import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { SMOGON_VALID_CUTOFFS } from '../config/smogon.config';

export class QueryPersonalMetaDto {
  @ApiProperty({ example: 'regi', description: 'Regulation ID from vgc_regulations' })
  @IsString()
  @IsNotEmpty()
  regulationId: string;

  @ApiPropertyOptional({
    enum: ['auto', 'smogon', 'champions', 'limitless'],
    default: 'auto',
    description: 'Meta source used for comparison',
  })
  @IsOptional()
  @IsIn(['auto', 'smogon', 'champions', 'limitless'])
  source?: 'auto' | 'smogon' | 'champions' | 'limitless';

  @ApiPropertyOptional({ example: '2026-03', description: 'Smogon month in YYYY-MM format (optional)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month?: string;

  @ApiPropertyOptional({ enum: SMOGON_VALID_CUTOFFS, default: 1760 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(SMOGON_VALID_CUTOFFS)
  cutoff?: number;
}
