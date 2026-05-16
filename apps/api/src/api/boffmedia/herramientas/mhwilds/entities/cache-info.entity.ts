import { ApiProperty } from '@nestjs/swagger';

export class CacheInfoEntity {
  @ApiProperty({
    example: true,
    description: 'Whether the data was retrieved from cache',
  })
  fromCache: boolean;

  @ApiProperty({
    example: '2025-07-16T10:30:00Z',
    description: 'Timestamp when the data was fetched',
  })
  fetchTime: Date;

  @ApiProperty({
    example: 3600000,
    description: 'Age of cached data in milliseconds (if from cache)',
    required: false,
  })
  cacheAge?: number;
}

export class CacheOperationResultEntity {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Cache cleared successfully',
    description: 'Description of the operation result',
  })
  message: string;

  @ApiProperty({
    description: 'Additional statistics or information',
    example: { filesCleared: 5, totalSize: '2.5MB' },
    required: false,
  })
  stats?: any;
}
