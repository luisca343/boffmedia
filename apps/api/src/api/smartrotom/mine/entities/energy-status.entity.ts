import { ApiProperty } from '@nestjs/swagger';

export class EnergyStatus {
  @ApiProperty({ 
    description: 'Current energy amount',
    example: 8
  })
  energy: number;

  @ApiProperty({ 
    description: 'Maximum energy capacity',
    example: 10
  })
  maxEnergy: number;

  @ApiProperty({ 
    description: 'Last energy charge time',
    example: '2025-06-28T09:00:00Z'
  })
  lastCharge: Date;

  @ApiProperty({ 
    description: 'Time in milliseconds until next energy charge',
    example: 1800000,
    required: false
  })
  timeToNextCharge?: number;
}