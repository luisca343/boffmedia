import { ApiProperty } from '@nestjs/swagger';

export class SystemHealthResponse {
  @ApiProperty({
    description: 'Overall system health',
    enum: ['healthy', 'degraded', 'unhealthy'],
    example: 'healthy',
  })
  overall: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({
    description: 'Cache system status',
    example: true,
  })
  cache: boolean;

  @ApiProperty({
    description: 'External API status',
    example: true,
  })
  externalAPI: boolean;

  @ApiProperty({
    description: 'File system status',
    example: true,
  })
  fileSystem: boolean;
}
