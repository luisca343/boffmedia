import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseEntity {
  @ApiProperty({
    description: 'Whether the request completed successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Resource retrieved successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Response payload, shape depends on the endpoint',
    type: 'object',
    additionalProperties: true,
  })
  data?: unknown;
}
