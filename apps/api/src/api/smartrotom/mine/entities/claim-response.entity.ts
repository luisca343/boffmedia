import { ApiProperty } from '@nestjs/swagger';
import { UnclaimedItem } from './unclaimed-item.entity';

export class ClaimResponse {
  @ApiProperty({
    description:
      'The items this call actually claimed. Grant from THIS, never from a ' +
      'client-side view of what was unclaimed — an empty array means a ' +
      'concurrent claim already took them.',
    type: [UnclaimedItem],
  })
  claimedItems: UnclaimedItem[];

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
