import { ApiProperty } from '@nestjs/swagger';

export class TcgUserCard {
  @ApiProperty({ example: '123_tcgp-A1-001', description: 'User card ID' })
  id: string;

  @ApiProperty({ example: 123, description: 'User ID' })
  userId: number;

  @ApiProperty({ example: 'tcgp-A1-001', description: 'Card ID' })
  cardId: string;

  @ApiProperty({ example: 'A1', description: 'Set ID' })
  setId: string;

  @ApiProperty({ example: 'Pikachu', description: 'Card name' })
  cardName: string;

  @ApiProperty({ example: 3, description: 'Quantity owned' })
  quantity: number;

  @ApiProperty({
    example: '2025-01-01T12:00:00Z',
    description: 'Date acquired',
  })
  acquiredDate: string;

  @ApiProperty({ example: '2025-01-01T12:00:00Z', description: 'Created at' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-01T12:00:00Z', description: 'Updated at' })
  updatedAt: string;
}

export class TcgUserCardHistory {
  @ApiProperty({
    example: '123_tcgp-A1-001_1735200000000',
    description: 'History entry ID',
  })
  id: string;

  @ApiProperty({ example: 123, description: 'User ID' })
  userId: number;

  @ApiProperty({ example: 'tcgp-A1-001', description: 'Card ID' })
  cardId: string;

  @ApiProperty({ example: 'A1', description: 'Set ID' })
  setId: string;

  @ApiProperty({ example: 'Pikachu', description: 'Card name' })
  cardName: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity change (+/-)',
    type: 'integer',
  })
  quantityChange: number;

  @ApiProperty({ example: '2025-01-01T12:00:00Z', description: 'Timestamp' })
  timestamp: string;
}
