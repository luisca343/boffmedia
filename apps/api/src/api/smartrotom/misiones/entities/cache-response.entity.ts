import { ApiProperty } from '@nestjs/swagger';

export class CacheRefreshResponse {
  @ApiProperty({
    description: 'Refresh success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Refresh timestamp',
    example: '2025-06-29T10:00:00Z',
  })
  timestamp: Date;
}

export class CacheStatusResponse {
  @ApiProperty({
    description: 'Whether cache is active',
    example: true,
  })
  cached: boolean;

  @ApiProperty({
    description: 'Cache age in milliseconds',
    example: 3600000,
    required: false,
  })
  age?: number;

  @ApiProperty({
    description: 'Milliseconds until next refresh',
    example: 10800000,
    required: false,
  })
  nextRefresh?: number;

  @ApiProperty({
    description: 'Cache health status',
    example: true,
  })
  healthy: boolean;
}
