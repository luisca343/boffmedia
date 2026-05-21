import { ApiProperty } from '@nestjs/swagger';

export class BiomeSpawnEntry {
  @ApiProperty({
    description: 'Pokédex number',
    example: 618,
  })
  dex: number;

  @ApiProperty({
    description: 'Species name',
    example: 'stunfisk',
  })
  species: string;

  @ApiProperty({
    description: 'Form name',
    example: 'base',
  })
  form: string;

  @ApiProperty({
    description: 'Spawn rarity',
    example: 10,
  })
  rarity: number;

  @ApiProperty({
    description: 'Spawn percentage',
    example: 50,
  })
  percentage: number;
}

export class BiomeSpawnCollection {
  @ApiProperty({
    description: 'Standard spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  standard?: BiomeSpawnEntry[];

  @ApiProperty({
    description: 'Fishing spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  fishing?: BiomeSpawnEntry[];

  @ApiProperty({
    description: 'Headbutt spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  headbutt?: BiomeSpawnEntry[];

  @ApiProperty({
    description: 'Sweet Scent spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  sweetscent?: BiomeSpawnEntry[];

  @ApiProperty({
    description: 'Cave Rock spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  caverock?: BiomeSpawnEntry[];

  @ApiProperty({
    description: 'Rock Smash spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  rocksmash?: BiomeSpawnEntry[];

  @ApiProperty({
    description: 'Forage spawns',
    type: [BiomeSpawnEntry],
    required: false,
  })
  forage?: BiomeSpawnEntry[];
}
