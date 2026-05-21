import { ApiProperty } from '@nestjs/swagger';

export class PokemonBiomes {
  @ApiProperty({
    description: 'List of biomes where the Pokemon can be found',
    type: [String],
    example: [
      'redwoods',
      'biomesoplenty:seasonal_forest',
      'byg:seasonal_forest',
      'byg:seasonal_forest_hills',
      'biomesoplenty:burnt_forest',
      'teras:pueblo_sakura',
      'pixelmon:ultra_forest',
      'pixelmon:ultra_plant',
    ],
  })
  biomes: string[];
}
