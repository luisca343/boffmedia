import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EpubMetadataDto } from './epub-metadata.dto';

export class ConvertChapterDto {
  @IsString()
  @IsNotEmpty()
  series: string;

  @IsString()
  @IsNotEmpty()
  chapter: string;

  @IsArray()
  @IsOptional()
  excludePages?: number[];

  @IsBoolean()
  @IsOptional()
  includeCover?: boolean;

  @ValidateNested()
  @Type(() => EpubMetadataDto)
  @IsOptional()
  metadata?: EpubMetadataDto;
}
