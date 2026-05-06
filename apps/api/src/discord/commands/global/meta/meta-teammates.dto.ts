import { StringOption } from 'necord';

export class MetaTeammatesDto {
  @StringOption({
    name:         'regulation',
    description:  'VGC regulation (e.g. Reg H, Reg I)',
    required:     true,
    autocomplete: true,
  })
  regulation: string;

  @StringOption({
    name:         'pokemon',
    description:  'Pokémon to look up teammates for',
    required:     true,
    autocomplete: true,
  })
  pokemon: string;

  @StringOption({
    name:         'pokemon2',
    description:  'Second Pokémon — find teammates common to both',
    required:     false,
    autocomplete: true,
  })
  pokemon2?: string;

  @StringOption({
    name:         'pokemon3',
    description:  'Third Pokémon — find teammates common to all three',
    required:     false,
    autocomplete: true,
  })
  pokemon3?: string;
}
