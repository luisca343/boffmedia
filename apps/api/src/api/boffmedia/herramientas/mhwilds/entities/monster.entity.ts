import { ApiProperty } from '@nestjs/swagger';

export class MonsterEntity {
  @ApiProperty({ example: 12, description: 'Unique identifier for the monster' })
  id: number;

  @ApiProperty({ example: 'Rathalos', description: 'Name of the monster' })
  name: string;

  @ApiProperty({
    example: 'large',
    description: 'Monster class (large or small)',
  })
  kind: string;

  @ApiProperty({
    example: 'flying wyvern',
    description: 'Species / classification of the monster',
  })
  species: string;

  @ApiProperty({ description: 'Flavour description of the monster' })
  description: string;

  @ApiProperty({ required: false, description: 'Base health at low rank' })
  baseHealth?: number;

  @ApiProperty({ description: 'Size thresholds (base/mini/silver/gold crowns)' })
  size: Record<string, number>;

  @ApiProperty({
    description: 'Elemental / status / effect weaknesses',
    isArray: true,
  })
  weaknesses: unknown[];

  @ApiProperty({ description: 'Elemental / effect resistances', isArray: true })
  resistances: unknown[];

  @ApiProperty({ description: 'Ailments the monster can inflict', isArray: true })
  ailments: unknown[];

  @ApiProperty({ description: 'Elements the monster uses', isArray: true })
  elements: string[];

  @ApiProperty({ description: 'Locations where the monster appears', isArray: true })
  locations: unknown[];

  @ApiProperty({ description: 'Carve / capture / reward drops', isArray: true })
  rewards: unknown[];
}
