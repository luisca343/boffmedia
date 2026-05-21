import { ApiProperty } from '@nestjs/swagger';

export class HistoryEntry {
  @ApiProperty({
    description: 'Game ID',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Item identifier',
    example: 'gema_roja',
  })
  itemId: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Gema Roja',
  })
  itemName: string;

  @ApiProperty({
    description: 'Whether item was claimed (0 or 1)',
    example: 0,
  })
  claimed: number;

  @ApiProperty({
    description: 'Item value',
    example: 500,
  })
  value: number;

  @ApiProperty({
    description: 'Date when item was obtained',
    example: '2025-06-28T10:00:00Z',
  })
  date: Date;
}

export class PlayerHistory {
  [gameId: number]: HistoryEntry[];
}
