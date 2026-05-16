import { ApiProperty } from '@nestjs/swagger';

export class PlayerEnergy {
  @ApiProperty({
    example: 8,
    description: 'Current energy amount',
  })
  energy: number;

  @ApiProperty({
    example: 10,
    description: 'Maximum energy capacity',
  })
  maxEnergy: number;

  @ApiProperty({
    example: '2025-06-28T09:00:00Z',
    description: 'Last energy charge time',
  })
  lastCharge: Date;

  @ApiProperty({
    example: 1800000,
    description: 'Time in milliseconds until next energy charge',
    required: false,
  })
  timeToNextCharge?: number;
}
