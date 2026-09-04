import { ApiProperty } from '@nestjs/swagger';

/**
 * How one file ended.
 *
 * `stalled` and `cancelled` are separate from `failed` on purpose: a stall is
 * a dead connection the user can retry, a cancel is something the user did,
 * and a failure is an error they have to read. Collapsing the three is exactly
 * what left the old UI showing progress that never advanced.
 */
export type FileDownloadStatus =
  | 'downloaded'
  | 'skipped'
  | 'failed'
  | 'stalled'
  | 'cancelled';

export class FileDownloadEntry {
  @ApiProperty({ example: 'Super Mario 3D Land (Europe).zip' })
  filename: string;

  @ApiProperty({
    enum: ['downloaded', 'skipped', 'failed', 'stalled', 'cancelled'],
  })
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

  @ApiProperty({
    example: 10,
    description: 'Files that already existed locally and were skipped',
  })
  skipped: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({
    example: 1,
    description:
      'Files abandoned because the connection stopped sending bytes. Their partial data was deleted.',
  })
  stalled: number;

  @ApiProperty({
    example: 0,
    description: 'Files not attempted or aborted because the caller cancelled.',
  })
  cancelled: number;

  @ApiProperty({ example: '274.58 GiB' })
  totalDownloadedSize: string;

  @ApiProperty({ example: 294832123904 })
  totalDownloadedSizeBytes: number;

  @ApiProperty({ type: [FileDownloadEntry] })
  files: FileDownloadEntry[];
}
