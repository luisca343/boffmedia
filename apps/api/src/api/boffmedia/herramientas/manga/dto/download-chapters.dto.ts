import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ChapterEntry {
  @ApiProperty({
    description: 'Human-readable chapter title, e.g. "Chapter 42"',
  })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Full URL to the chapter reading page' })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Chapter number as string (supports decimals like "1.5")',
  })
  @IsString()
  number: string;
}

export class DownloadChaptersDto {
  @ApiProperty({ description: 'Series name used as the folder name on disk' })
  @IsString()
  @IsNotEmpty()
  seriesName: string;

  @ApiProperty({ type: [ChapterEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterEntry)
  chapters: ChapterEntry[];

  @ApiProperty({
    required: false,
    description: 'Max concurrent chapter downloads (1-3, default 1)',
  })
  @IsOptional()
  @IsNumber()
  concurrency?: number;

  @ApiProperty({
    required: false,
    description:
      'Manga detail page URL, used as Referer when fetching chapter pages',
  })
  @IsOptional()
  @IsString()
  mangaUrl?: string;
}
