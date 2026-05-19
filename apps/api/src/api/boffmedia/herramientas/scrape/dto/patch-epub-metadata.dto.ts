import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EpubMetadataDto } from './epub-metadata.dto';

export class PatchEpubMetadataDto {
  @IsString()
  @IsNotEmpty()
  series: string;

  @IsArray()
  chapters: string[];

  @ValidateNested()
  @Type(() => EpubMetadataDto)
  @IsOptional()
  metadata?: EpubMetadataDto;
}
