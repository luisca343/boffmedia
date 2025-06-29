import { ApiProperty } from '@nestjs/swagger';

export class NPCUpdateResponse {
  @ApiProperty({ 
    description: 'Operation status',
    example: 'ok'
  })
  status: string;

  @ApiProperty({ 
    description: 'Number of NPCs updated',
    example: 5
  })
  updated: number;

  @ApiProperty({ 
    description: 'Update timestamp',
    example: '2025-06-29T10:00:00Z'
  })
  timestamp: Date;
}