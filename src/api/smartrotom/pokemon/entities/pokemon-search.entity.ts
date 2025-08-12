import { ApiProperty } from '@nestjs/swagger';
import { Pokemon } from './pokemon.entity';

export class PokemonSearchResult {
  @ApiProperty({ 
    description: 'Pokémon data',
    type: Pokemon
  })
  item: Pokemon;

  @ApiProperty({ 
    description: 'Search score',
    example: 0.8
  })
  score: number;

  @ApiProperty({ 
    description: 'Reference index',
    example: 0
  })
  refIndex: number;
}