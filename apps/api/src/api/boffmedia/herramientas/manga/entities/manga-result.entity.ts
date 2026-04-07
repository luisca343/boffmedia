import { ApiProperty } from '@nestjs/swagger';

export class MangaResult {
  @ApiProperty() title: string;
  @ApiProperty() url: string;
  @ApiProperty() source: string;
  @ApiProperty({ required: false }) coverUrl?: string;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty({ required: false }) chapterCount?: number;
}

export class MangaSearchResult {
  @ApiProperty() query: string;
  @ApiProperty({ type: [MangaResult] }) results: MangaResult[];
}
