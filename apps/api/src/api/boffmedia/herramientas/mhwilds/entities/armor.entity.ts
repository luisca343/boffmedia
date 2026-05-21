import { ApiProperty } from '@nestjs/swagger';

export class ArmorEntity {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the armor piece',
  })
  id: number;

  @ApiProperty({
    example: 'Leather Helmet',
    description: 'Name of the armor piece',
  })
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Rarity level of the armor',
  })
  rarity: number;

  @ApiProperty({
    example: 'head',
    description: 'Type of armor piece (head, chest, arms, waist, legs)',
  })
  type: string;

  @ApiProperty({
    description: 'Defense values for the armor',
    example: {
      base: 10,
      max: 20,
      fire: 0,
      water: 0,
      thunder: 0,
      ice: 0,
      dragon: 0,
    },
  })
  defense: any;

  @ApiProperty({
    description: 'Skills provided by the armor',
    example: [],
    type: [Object],
  })
  skills: any[];

  @ApiProperty({
    description: 'Decoration slots available',
    example: [1, 1],
    type: [Number],
  })
  slots: number[];

  @ApiProperty({
    description: 'Materials required for crafting',
    example: [],
    type: [Object],
  })
  craftingMaterials: any[];

  @ApiProperty({
    example: 800,
    description: 'Zenny cost for crafting',
  })
  craftingZennyCost: number;
}
