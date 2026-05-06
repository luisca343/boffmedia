import { ApiProperty } from '@nestjs/swagger';

export class MangaChapter {
  @ApiProperty() title: string;
  @ApiProperty() url: string;
  @ApiProperty() number: string;
}

export class MangaDetail {
  @ApiProperty() title: string;
  @ApiProperty() url: string;
  @ApiProperty() source: string;
  @ApiProperty({ required: false }) coverUrl?: string;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty({ type: [MangaChapter] }) chapters: MangaChapter[];
  @ApiProperty() chapterCount: number;
}

export class LocalChaptersResult {
  @ApiProperty() seriesName: string;
  @ApiProperty() count: number;
  @ApiProperty({ type: [String] }) files: string[];
}
