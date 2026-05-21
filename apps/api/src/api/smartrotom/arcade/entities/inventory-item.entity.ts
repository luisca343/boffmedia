import { ApiProperty } from '@nestjs/swagger';
import { ItemRarity } from './arcade-inventory.entity';

export class InventoryItem {
  @ApiProperty({
    example: 123,
    description: 'Unique identifier for the inventory item',
  })
  id: number;

  @ApiProperty({
    example: 'pixelmon:master_ball',
    description: 'Item identifier',
  })
  itemId: string;

  @ApiProperty({
    example: 'ITEM',
    description: 'Type of item',
  })
  itemType: string;

  @ApiProperty({
    example: 5,
    description: 'Amount of items',
  })
  amount: number;

  @ApiProperty({
    example: 'arcade',
    description: 'Source where the item came from',
  })
  sourceType: string;

  @ApiProperty({
    example: 0,
    description: 'Amount of items used/consumed',
  })
  used: number;

  @ApiProperty({
    example: 'legendary',
    description: 'Rarity of the item',
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  })
  rarity: ItemRarity;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'When the item was added',
  })
  createdAt: Date;

  @ApiProperty({
    example: 3,
    description: 'Remaining amount (for consumables)',
    required: false,
  })
  remainingAmount?: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Original database IDs for this aggregated item',
    required: false,
  })
  originalIds?: number[];
}

export class InventoryResponse {
  @ApiProperty({
    description: 'All inventory items',
    type: [InventoryItem],
  })
  items: InventoryItem[];

  @ApiProperty({
    description: 'Items grouped by type',
    example: { ITEM: [], POKEMON: [], lootbox: [] },
  })
  groupedItems: Record<string, InventoryItem[]>;

  @ApiProperty({
    description: 'Raw items from database',
    type: [InventoryItem],
  })
  rawItems: InventoryItem[];
}
