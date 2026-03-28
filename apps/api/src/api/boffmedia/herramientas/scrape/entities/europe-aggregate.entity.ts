import { ApiProperty } from '@nestjs/swagger';
import { GameFileEntry } from './game-file.entity';

export class EuropeAggregateResult {
  @ApiProperty({
    example: 847,
    description: 'Number of releases found',
  })
  count: number;

  @ApiProperty({
    example: '1.47 TiB',
    description: 'Total aggregated file size',
  })
  totalSize: string;

  @ApiProperty({
    example: 1614341210112,
    description: 'Total aggregated file size in bytes',
  })
  totalSizeBytes: number;

  @ApiProperty({
    type: [GameFileEntry],
    description: 'Matched game files',
  })
  files: GameFileEntry[];
}
