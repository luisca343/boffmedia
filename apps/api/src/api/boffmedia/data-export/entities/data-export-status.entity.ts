import { ApiProperty } from '@nestjs/swagger';

import { EXPORT_STATUS } from '@/_db/schema/BoffMediaDataExports';

/**
 * What the profile page polls while an export is being built.
 *
 * Deliberately NOT the raw row: `filename` never leaves the API. The browser
 * asks for `/users/me/data-export/:id/download` and the service resolves the
 * name itself, so a leaked response body is not a leaked path.
 */
export class DataExportStatusEntity {
  @ApiProperty({ type: Number, example: 42, description: 'Export request id' })
  id: number;

  @ApiProperty({
    enum: Object.values(EXPORT_STATUS),
    example: EXPORT_STATUS.READY,
    description:
      'pending = queued, ready = downloadable, failed = try again, expired = the file has been deleted',
  })
  status: string;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the archive stops being downloadable.',
  })
  expiresAt: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Size of the archive in bytes, once it exists.',
  })
  sizeBytes: number | null;
}
