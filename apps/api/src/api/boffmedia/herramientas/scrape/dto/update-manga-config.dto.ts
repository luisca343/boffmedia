import { IsBoolean, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CronConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  schedule?: string;
}

export class UpdateMangaConfigDto {
  @ValidateNested()
  @Type(() => CronConfigDto)
  @IsOptional()
  cron?: CronConfigDto;
}
