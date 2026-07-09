import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EpubMetadataDto } from './epub-metadata.dto';

export class ConvertChapterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  series: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chapter: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsOptional()
  excludePages?: number[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeCover?: boolean;

  @ApiPropertyOptional({ type: EpubMetadataDto })
  @ValidateNested()
  @Type(() => EpubMetadataDto)
  @IsOptional()
  metadata?: EpubMetadataDto;
}
