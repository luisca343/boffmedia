import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EpubMetadataDto } from './epub-metadata.dto';

export class PatchEpubMetadataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  series: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  chapters: string[];

  @ApiPropertyOptional({ type: EpubMetadataDto })
  @ValidateNested()
  @Type(() => EpubMetadataDto)
  @IsOptional()
  metadata?: EpubMetadataDto;
}
