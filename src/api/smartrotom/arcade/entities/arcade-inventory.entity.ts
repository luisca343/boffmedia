import { ApiProperty } from '@nestjs/swagger';

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export class ArcadeInventoryItem {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the inventory record' 
  })
  id: number;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 'potion_heal', 
    description: 'Item ID' 
  })
  itemId: string;

  @ApiProperty({ 
    example: 'consumable', 
    description: 'Item type' 
  })
  itemType: string;

  @ApiProperty({ 
    example: 5, 
    description: 'Item amount' 
  })
  amount: number;

  @ApiProperty({ 
    example: 'rare', 
    description: 'Item rarity',
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
  })
  rarity: ItemRarity;

  @ApiProperty({ 
    example: 'lootbox', 
    description: 'Source type (how item was obtained)' 
  })
  sourceType: string;

  @ApiProperty({ 
    example: 0, 
    description: 'Whether item has been used (0 = not used, 1 = used)' 
  })
  used: number;

  @ApiProperty({ 
    example: '2023-11-01T10:00:00Z', 
    description: 'Record creation date' 
  })
  createdAt: Date;
}