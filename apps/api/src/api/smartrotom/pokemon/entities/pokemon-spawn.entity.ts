import { ApiProperty } from '@nestjs/swagger';

export class HeldItem {
  @ApiProperty({
    description: 'Item ID',
    example: 'pixelmon:charcoal',
  })
  itemID: string;

  @ApiProperty({
    description: 'Chance percentage for held item',
    example: 5,
  })
  percentChance: number;
}

export class SpawnCondition {
  @ApiProperty({
    description: 'Time conditions',
    type: [String],
    example: ['NIGHT'],
    required: false,
  })
  times?: string[];

  @ApiProperty({
    description: 'Weather conditions',
    type: [String],
    example: ['CLEAR'],
    required: false,
  })
  weathers?: string[];

  @ApiProperty({
    description: 'Biome conditions',
    type: [String],
    example: ['redwoods', 'biomesoplenty:seasonal_forest'],
  })
  stringBiomes: string[];
}

export class SpawnInfo {
  @ApiProperty({
    description: 'Species specification',
    example: 'species:Vulpix',
  })
  spec: string;

  @ApiProperty({
    description: 'Location types where Pokemon spawns',
    type: [String],
    example: ['Land'],
  })
  stringLocationTypes: string[];

  @ApiProperty({
    description: 'Minimum spawn level',
    example: 10,
  })
  minLevel: number;

  @ApiProperty({
    description: 'Maximum spawn level',
    example: 19,
  })
  maxLevel: number;

  @ApiProperty({
    description: 'Type ID',
    example: 'pokemon',
  })
  typeID: string;

  @ApiProperty({
    description: 'Held items with drop chances',
    type: [HeldItem],
    required: false,
  })
  heldItems?: HeldItem[];

  @ApiProperty({
    description: 'Spawn conditions',
    type: SpawnCondition,
  })
  condition: SpawnCondition;

  @ApiProperty({
    description: 'Spawn rarity',
    example: 90,
  })
  rarity: number;

  @ApiProperty({
    description: 'Spawn type',
    example: 'standard',
  })
  spawnType: string;

  @ApiProperty({
    description: 'Pokémon name',
    example: 'vulpix',
  })
  pokemonName: string;

  @ApiProperty({
    description: 'Pokémon form',
    example: 'base',
  })
  pokemonForm: string;

  @ApiProperty({
    description: 'Pokémon palette',
    example: 'strike',
    required: false,
  })
  pokemonPalette?: string;

  @ApiProperty({
    description: 'Pokédex number',
    example: 37,
  })
  pokemonDex: number;

  @ApiProperty({
    description: 'Gender',
    example: 'all',
    required: false,
  })
  gender?: string;
}

export class BiomeSpawnData {
  @ApiProperty({
    description: 'Pokédex number',
    example: 25,
  })
  dex: number;

  @ApiProperty({
    description: 'Species name',
    example: 'Pikachu',
  })
  species: string;

  @ApiProperty({
    description: 'Form name',
    example: 'base',
  })
  form: string;

  @ApiProperty({
    description: 'Palette name',
    example: 'none',
  })
  palette: string;

  @ApiProperty({
    description: 'Spawn rarity',
    example: 10,
  })
  rarity: number;

  @ApiProperty({
    description: 'Spawn percentage',
    example: 5.2,
  })
  percentage: number;
}
