import { ApiProperty } from '@nestjs/swagger';

export class FicusAiHealthEntity {
  @ApiProperty({ example: 'FicusAI', description: 'Service name' })
  service: string;

  @ApiProperty({ example: 'healthy', description: 'Service health status' })
  status: string;

  @ApiProperty({
    example: '2024-08-02T10:30:00.000Z',
    description: 'ISO timestamp of the health check',
  })
  timestamp: string;
}
