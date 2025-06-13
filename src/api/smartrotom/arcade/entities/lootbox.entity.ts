import { ApiProperty } from '@nestjs/swagger';

export class LootboxItem {
  @ApiProperty({ 
    example: 'pixelmon:poke_ball', 
    description: 'Item identifier' 
  })
  id: string;

  @ApiProperty({ 
    example: 90, 
    description: 'Weight for probability calculation' 
  })
  weight: number;
}

export class LootboxConfig {
  @ApiProperty({ 
    example: 'trainer_box', 
    description: 'Unique identifier for the lootbox' 
  })
  id: string;

  @ApiProperty({ 
    example: 'Caja de Entrenador', 
    description: 'Display name of the lootbox' 
  })
  name: string;

  @ApiProperty({ 
    example: '/smartrotom/img/apps/arcade/lootbox/trainer_box.png', 
    description: 'Image path for the lootbox' 
  })
  image: string;

  @ApiProperty({ 
    example: 'Una caja básica con objetos esenciales para entrenadores principiantes.', 
    description: 'Description of the lootbox contents' 
  })
  description: string;

  @ApiProperty({ 
    description: 'Items that can be obtained from this lootbox', 
    type: [LootboxItem] 
  })
  items: LootboxItem[];

  @ApiProperty({ 
    example: 'blue', 
    description: 'Theme color for the lootbox UI' 
  })
  theme: string;
}

export class RarityRange {
  @ApiProperty({ example: 50, description: 'Minimum weight for this rarity' })
  min: number;

  @ApiProperty({ example: 100, description: 'Maximum weight for this rarity' })
  max: number;
}

export class LootboxConfigResponse {
  @ApiProperty({ 
    description: 'Rarity weight ranges', 
    example: { 
      common: { min: 50, max: 100 }, 
      uncommon: { min: 20, max: 49 } 
    } 
  })
  rarityRanges: Record<string, RarityRange>;

  @ApiProperty({ 
    description: 'Available lootbox configurations' 
  })
  lootboxConfig: {
    boxes: LootboxConfig[];
  };
}