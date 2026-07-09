import { ApiProperty } from '@nestjs/swagger';

export class PokedexStatistics {
  @ApiProperty({
    description: 'Number of Pokémon seen',
    example: 150,
  })
  seenPokemon: number;

  @ApiProperty({
    description: 'Number of Pokémon caught',
    example: 100,
  })
  caughtPokemon: number;

  @ApiProperty({
    description: 'Total number of Pokémon',
    example: 1025,
  })
  totalPokemon: number;

  @ApiProperty({
    description: 'Number of Pokémon not yet seen',
    example: 875,
  })
  missingPokemon: number;

  @ApiProperty({
    description: 'Number of Pokémon seen but not caught',
    example: 925,
  })
  missingCaughtPokemon: number;

  @ApiProperty({
    description: 'Number of shiny Pokémon caught',
    example: 5,
  })
  shinyPokemon: number;
}

export class DetailedPokedexStatistics {
  @ApiProperty({
    description: 'List of seen Pokémon (format: id:form)',
    example: ['1:base', '2:base', '25:base'],
    type: [String],
  })
  seenPokemon: string[];

  @ApiProperty({
    description: 'List of caught Pokémon (format: id:form)',
    example: ['1:base', '25:base'],
    type: [String],
  })
  caughtPokemon: string[];

  @ApiProperty({
    description: 'List of shiny Pokémon caught (format: id:form)',
    example: ['25:base'],
    type: [String],
  })
  shinyPokemon: string[];

  @ApiProperty({
    description: 'Total number of Pokémon species',
    example: 1025,
  })
  totalPokemon: number;

  @ApiProperty({
    description: 'Total number of forms',
    example: 1200,
  })
  totalForms: number;

  @ApiProperty({
    description: 'Number of unique Pokémon seen',
    example: 150,
  })
  seenCount: number;

  @ApiProperty({
    description: 'Number of unique Pokémon caught',
    example: 100,
  })
  caughtCount: number;

  @ApiProperty({
    description: 'Number of shiny Pokémon caught',
    example: 5,
  })
  shinyCount: number;

  @ApiProperty({
    description: 'Number of Pokémon species not seen',
    example: 875,
  })
  missingSeenPokemon: number;

  @ApiProperty({
    description: 'Number of Pokémon species not caught',
    example: 925,
  })
  missingCaughtPokemon: number;

  @ApiProperty({
    description: 'Number of forms not seen',
    example: 1050,
  })
  missingSeenForms: number;

  @ApiProperty({
    description: 'Number of forms not caught',
    example: 1100,
  })
  missingCaughtForms: number;
}

export class PokedexRegistry {
  @ApiProperty({
    description: 'Pokémon ID',
    example: 25,
  })
  pokemonId: number;

  @ApiProperty({
    description: 'Form ID',
    example: 'base',
  })
  formId: string;

  @ApiProperty({
    description: 'Palette ID',
    example: 'none',
  })
  paletteId: string;

  @ApiProperty({
    description: 'Date when first seen',
    example: '2025-06-29T10:00:00Z',
    type: Date,
    nullable: true,
    required: false,
  })
  seenAt: Date | null;

  @ApiProperty({
    description: 'Date when caught',
    example: '2025-06-29T12:00:00Z',
    type: Date,
    nullable: true,
    required: false,
  })
  caughtAt: Date | null;

  @ApiProperty({
    description: 'Pokémon name',
    example: 'Pikachu',
  })
  pokemonName: string;
}
