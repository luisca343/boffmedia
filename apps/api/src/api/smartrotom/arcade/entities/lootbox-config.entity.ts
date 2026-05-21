import { ApiProperty } from '@nestjs/swagger';
import { ItemRarity } from './arcade-inventory.entity';

export class LootboxItemConfig {
  @ApiProperty({
    example: 'pixelmon:poke_ball',
    description: 'Unique identifier for the item',
  })
  id: string;

  @ApiProperty({
    example: 90,
    description: 'Weight value determining item rarity probability',
  })
  weight: number;

  @ApiProperty({
    example: 'rare',
    description: 'Rarity category of the item',
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  })
  rarity?: ItemRarity;

  @ApiProperty({
    example: 'item',
    description: 'Type of the item',
  })
  type?: string;

  @ApiProperty({
    example: 'Pikachu lvl:25',
    description: 'Additional data associated with the item',
  })
  data?: string;

  @ApiProperty({
    example: 1,
    description: 'Amount of the item',
    default: 1,
  })
  amount?: number;
}

export class LootboxBoxConfig {
  @ApiProperty({
    example: 'trainer_box',
    description: 'Unique identifier for the lootbox',
  })
  id: string;

  @ApiProperty({
    example: 'Caja de Entrenador',
    description: 'Display name of the lootbox',
  })
  name: string;

  @ApiProperty({
    example: '/smartrotom/img/apps/arcade/lootbox/trainer_box.png',
    description: 'Image path for the lootbox',
  })
  image: string;

  @ApiProperty({
    example:
      'Una caja básica con objetos esenciales para entrenadores principiantes.',
    description: 'Description of the lootbox contents',
  })
  description: string;

  @ApiProperty({
    type: [LootboxItemConfig],
    description: 'Items that can be obtained from this lootbox',
    example: [
      { id: 'pixelmon:poke_ball', weight: 90 },
      { id: 'pixelmon:potion', weight: 90 },
      { id: 'pixelmon:master_ball', weight: 2 },
    ],
  })
  items: LootboxItemConfig[];

  @ApiProperty({
    example: 'blue',
    description: 'Theme color for the lootbox UI',
  })
  theme: string;
}

export class RarityRange {
  @ApiProperty({
    example: 50,
    description: 'Minimum weight value for this rarity',
  })
  min: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum weight value for this rarity',
  })
  max: number;
}

export class LootboxBoxesCollection {
  @ApiProperty({
    type: [LootboxBoxConfig],
    description: 'List of available lootbox types',
  })
  boxes: LootboxBoxConfig[];
}

export class LootboxConfigEntity {
  @ApiProperty({
    description: 'Rarity weight range configuration',
    example: {
      common: { min: 50, max: 100 },
      uncommon: { min: 20, max: 49 },
      rare: { min: 10, max: 19 },
      epic: { min: 3, max: 9 },
      legendary: { min: 1, max: 2 },
    },
  })
  rarityRanges: Record<string, RarityRange>;

  @ApiProperty({
    description: 'Available lootboxes configuration',
    type: LootboxBoxesCollection,
  })
  lootboxConfig: LootboxBoxesCollection;
}
