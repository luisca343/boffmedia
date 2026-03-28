import { ApiProperty } from '@nestjs/swagger';

export type FileDownloadStatus = 'downloaded' | 'skipped' | 'failed';

export class FileDownloadEntry {
  @ApiProperty({ example: 'Super Mario 3D Land (Europe).zip' })
  filename: string;

  @ApiProperty({ enum: ['downloaded', 'skipped', 'failed'] })
  status: FileDownloadStatus;

  @ApiProperty({ example: '1.19 GiB', required: false })
  size?: string;

  @ApiProperty({ example: 1277116416, required: false })
  sizeBytes?: number;

  @ApiProperty({ example: 'ECONNRESET', required: false })
  error?: string;
}

export class BulkDownloadResult {
  @ApiProperty({ example: '3ds' })
  console: string;

  @ApiProperty({ example: 'Nintendo 3DS (Decrypted)' })
  consoleLabel: string;

  @ApiProperty({ type: [String], example: ['Europe'] })
  regions: string[];

  @ApiProperty({ example: 312 })
  totalMatched: number;

  @ApiProperty({ example: 300 })
  downloaded: number;

  @ApiProperty({ example: 10, description: 'Files that already existed locally and were skipped' })
  skipped: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ example: '274.58 GiB' })
  totalDownloadedSize: string;

  @ApiProperty({ example: 294832123904 })
  totalDownloadedSizeBytes: number;

  @ApiProperty({ type: [FileDownloadEntry] })
  files: FileDownloadEntry[];
}
