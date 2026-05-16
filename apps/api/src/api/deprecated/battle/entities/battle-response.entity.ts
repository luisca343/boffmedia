import { ApiProperty } from '@nestjs/swagger';

export class BattleOperationResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;
}

export class GetAllConfigsResponse {
  @ApiProperty({
    example: ['gym-leader-brock', 'gym-leader-misty', 'elite-four-bruno'],
    description: 'List of available battle configuration names',
    type: [String],
  })
  configs: string[];
}

export class ReplayListResponse {
  @ApiProperty({
    description: 'List of battle replays',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        side1: { type: 'string' },
        side2: { type: 'string' },
        winner: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
      },
    },
  })
  replays: any[];
}
