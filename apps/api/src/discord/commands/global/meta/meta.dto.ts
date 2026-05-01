import { StringOption, IntegerOption } from 'necord';

export class MetaPokemonDto {
  @StringOption({
    name:         'regulation',
    description:  'VGC regulation (e.g. Reg H, Reg I)',
    required:     true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name:         'pokemon',
    description:  'Pokémon name to look up',
    required:     true,
    autocomplete: true,
  })
  pokemon: string;
}

export class MetaTopDto {
  @StringOption({
    name:         'regulation',
    description:  'VGC regulation (e.g. Reg H, Reg I)',
    required:     true,
    autocomplete: true,
  })
  regulation: string;

  @IntegerOption({
    name:        'count',
    description: 'Number of Pokémon to show (default 10, max 20)',
    required:    false,
    min_value:   1,
    max_value:   20,
  })
  count?: number;
}

export class MetaCoreDto {
  @StringOption({
    name:         'regulation',
    description:  'VGC regulation (e.g. Reg H, Reg I)',
    required:     true,
    autocomplete: true,
  })
  regulation: string;
}

export class MetaCompareDto {
  @StringOption({
    name:         'regulation',
    description:  'VGC regulation (e.g. Reg H, Reg I)',
    required:     true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name:         'pokemon',
    description:  'First Pokémon',
    required:     true,
    autocomplete: true,
  })
  pokemon: string;

  @StringOption({
    name:         'pokemon2',
    description:  'Second Pokémon',
    required:     true,
    autocomplete: true,
  })
  pokemon2: string;
}
