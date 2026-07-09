import {
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class CronConfigDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  schedule?: string;
}

export class UpdateMangaConfigDto {
  @ApiPropertyOptional({ type: CronConfigDto })
  @ValidateNested()
  @Type(() => CronConfigDto)
  @IsOptional()
  cron?: CronConfigDto;
}
