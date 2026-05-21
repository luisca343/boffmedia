import { ApiProperty } from '@nestjs/swagger';

export class LootboxItem {
  @ApiProperty({
    example: 'pixelmon:poke_ball',
    description: 'Item identifier',
  })
  id: string;

  @ApiProperty({
    example: 90,
    description: 'Weight for probability calculation',
  })
  weight: number;
}

export class LootboxConfig {
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
    description: 'Items that can be obtained from this lootbox',
    type: [LootboxItem],
    example: [
      {
        id: 'pixelmon:poke_ball',
        weight: 90,
      },
      {
        id: 'pixelmon:potion',
        weight: 90,
      },
      {
        id: 'pixelmon:master_ball',
        weight: 2,
      },
    ],
  })
  items: LootboxItem[];

  @ApiProperty({
    example: 'blue',
    description: 'Theme color for the lootbox UI',
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
      uncommon: { min: 20, max: 49 },
      rare: { min: 10, max: 19 },
      epic: { min: 3, max: 9 },
      legendary: { min: 1, max: 2 },
    },
  })
  rarityRanges: Record<string, RarityRange>;

  @ApiProperty({
    description: 'Available lootbox configurations',
    example: {
      boxes: [
        {
          id: 'trainer_box',
          name: 'Caja de Entrenador',
          image: '/smartrotom/img/apps/arcade/lootbox/trainer_box.png',
          description:
            'Una caja básica con objetos esenciales para entrenadores principiantes.',
          items: [
            {
              id: 'pixelmon:poke_ball',
              weight: 90,
            },
            {
              id: 'pixelmon:master_ball',
              weight: 2,
            },
          ],
          theme: 'blue',
        },
        {
          id: 'evolution_box',
          name: 'Caja de Evolución',
          image: '/smartrotom/img/apps/arcade/lootbox/evolution_box.png',
          description:
            'Contiene objetos que ayudan a tus Pokémon a evolucionar.',
          items: [
            {
              id: 'leaf_stone',
              weight: 100,
            },
            {
              id: 'prism_scale',
              weight: 1,
            },
          ],
          theme: 'green',
        },
        {
          id: 'battle_box',
          name: 'Caja de Combate',
          image: '/smartrotom/img/apps/arcade/lootbox/battle_box.png',
          description:
            'Objetos avanzados para dar ventaja a tus Pokémon en combates competitivos.',
          items: [
            {
              id: 'x_attack',
              weight: 100,
            },
            {
              id: 'dynamax_band',
              weight: 1,
            },
          ],
          theme: 'red',
        },
      ],
    },
  })
  lootboxConfig: {
    boxes: LootboxConfig[];
  };
}
