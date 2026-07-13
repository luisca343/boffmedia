import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PagedQueryDto } from './paged-query.dto';

export class ListAuditoriaQueryDto extends PagedQueryDto {
  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  dep?: string;

  @ApiPropertyOptional({ description: 'Filter by actor UUID' })
  @IsOptional()
  @IsString()
  actorUuid?: string;

  @ApiPropertyOptional({
    description: 'Filter by source screen (gobierno | actividad)',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'ISO date, inclusive lower bound' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date, inclusive upper bound' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
