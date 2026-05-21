import { ApiProperty } from '@nestjs/swagger';

export class UnclaimedItem {
  @ApiProperty({
    description: 'Item ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Item identifier',
    example: 'gema_roja',
  })
  itemId: string;

  @ApiProperty({
    description: 'Item type',
    example: 'gema',
  })
  type: string;

  @ApiProperty({
    description: 'Item amount',
    example: 1,
    required: false,
  })
  amount?: number;
}
