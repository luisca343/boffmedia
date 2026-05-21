import { ApiProperty } from '@nestjs/swagger';

export class AbilityCount {
  @ApiProperty({
    description: 'Ability name',
    example: 'Static',
  })
  name: string;

  @ApiProperty({
    description: 'Number of Pokémon with this ability',
    example: 15,
  })
  count: number;
}

export class AbilityInfo {
  @ApiProperty({
    description: 'Ability name',
    example: 'Static',
  })
  name: string;

  @ApiProperty({
    description: 'Number of forms with this ability',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'Number of unique species with this ability',
    example: 15,
  })
  uniqueSpecies: number;
}

export class PokemonAbilityEntry {
  @ApiProperty({
    description: 'Pokémon species ID',
    example: 25,
  })
  speciesID: number;

  @ApiProperty({
    description: 'Form name',
    example: 'base',
  })
  form: string;

  @ApiProperty({
    description: 'Species name',
    example: 'Pikachu',
  })
  speciesName: string;
}
