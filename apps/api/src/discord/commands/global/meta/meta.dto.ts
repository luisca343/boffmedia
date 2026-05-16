import { StringOption, IntegerOption } from 'necord';

export class MetaPokemonDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name: 'pokemon',
    description: 'Pokémon name to look up',
    required: true,
    autocomplete: true,
  })
  pokemon: string;
}

export class MetaTopDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @IntegerOption({
    name: 'count',
    description: 'Number of Pokémon to show (default 10, max 20)',
    required: false,
    min_value: 1,
    max_value: 20,
  })
  count?: number;
}

export class MetaCoreDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;
}

export class MetaAnalyzeDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name: 'paste',
    description: 'Pokepast.es URL or raw Showdown paste (up to 6 Pokémon)',
    required: true,
  })
  paste: string;
}

export class MetaMatchupDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name: 'your',
    description: 'Your Pokémon',
    required: true,
    autocomplete: true,
  })
  your: string;

  @StringOption({
    name: 'vs',
    description: 'Opposing Pokémon',
    required: true,
    autocomplete: true,
  })
  vs: string;
}

export class MetaSpeedDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name: 'compare',
    description: 'Jump to this Pokémon and highlight it in the speed tiers',
    required: false,
    autocomplete: true,
  })
  compare?: string;
}

export class MetaThreatsDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name: 'paste',
    description: 'Pokepast.es URL or raw Showdown paste (up to 6 Pokémon)',
    required: true,
  })
  paste: string;
}

export class MetaDamageDto {
  @StringOption({
    name: 'regulation',
    description: 'VGC regulation (e.g. Reg H, Reg I)',
    required: true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name: 'pokemon',
    description: 'Attacking Pokémon',
    required: true,
    autocomplete: true,
  })
  pokemon: string;

  @StringOption({
    name: 'vs',
    description: 'Defending Pokémon',
    required: true,
    autocomplete: true,
  })
  vs: string;

  @StringOption({
    name: 'move',
    description: 'Specific move to calculate (leave blank for top 4)',
    required: false,
    autocomplete: true,
  })
  move?: string;
}
