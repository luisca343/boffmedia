import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeaponEntity {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the weapon',
  })
  id: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Localized game identifier used by the extracted asset pack',
  })
  gameId?: number;

  @ApiPropertyOptional({
    example: '1/2/7',
    description:
      'Unique occurrence key for a route through converging branches',
  })
  pathKey?: string;

  @ApiPropertyOptional({
    example: 'long-sword:12',
    description: 'Stable weapon-kind/game-id key for the 2D thumbnail',
  })
  assetKey?: string;

  @ApiProperty({
    example: 'Iron Sword',
    description: 'Name of the weapon',
  })
  name: string;

  @ApiPropertyOptional({ description: 'Weapon description' })
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'Rarity level of the weapon',
  })
  rarity: number;

  @ApiProperty({
    example: 'sword-and-shield',
    description: 'Type/kind of weapon',
  })
  kind: string;

  @ApiProperty({
    description: 'Damage information for the weapon',
    example: { raw: 140, element: null, affinity: 0 },
  })
  damage: any;

  @ApiProperty({
    description: 'Special abilities or effects',
    example: [],
    type: [Object],
  })
  specials: any[];

  @ApiProperty({
    description: 'Materials required for crafting',
    example: [],
    type: [Object],
  })
  craftingMaterials: any[];

  @ApiProperty({
    example: 1500,
    description: 'Zenny cost for crafting',
  })
  craftingZennyCost: number;

  @ApiProperty({
    description: 'Materials required for upgrading',
    example: [],
    type: [Object],
  })
  upgradeMaterials: any[];

  @ApiProperty({
    example: 2000,
    description: 'Zenny cost for upgrading',
  })
  upgradeZennyCost: number;
}
