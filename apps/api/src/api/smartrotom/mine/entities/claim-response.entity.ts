import { ApiProperty } from '@nestjs/swagger';

export class ClaimResponse {
  @ApiProperty({
    description: 'Array of claimed item IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  claimedIds: number[];

  @ApiProperty({
    description: 'Total number of items claimed',
    example: 3,
  })
  totalClaimed: number;

  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;
}
