import { ApiProperty } from '@nestjs/swagger';

export type ChapterDownloadStatus = 'downloaded' | 'skipped' | 'failed';

export class ChapterDownloadEntry {
  @ApiProperty() chapterTitle: string;
  @ApiProperty() filename: string;
  @ApiProperty() status: ChapterDownloadStatus;
  @ApiProperty({ required: false }) pages?: number;
  @ApiProperty({ required: false }) error?: string;
}

export class MangaDownloadResult {
  @ApiProperty() seriesName: string;
  @ApiProperty() downloaded: number;
  @ApiProperty() skipped: number;
  @ApiProperty() failed: number;
  @ApiProperty({ type: [ChapterDownloadEntry] }) chapters: ChapterDownloadEntry[];
}
