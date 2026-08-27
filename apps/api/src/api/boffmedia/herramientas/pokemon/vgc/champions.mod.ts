/**
 * Champions mod registration for @pkmn/sim.
 *
 * Data tables are generated from the official Pokémon Showdown Champions mod:
 * https://github.com/smogon/pokemon-showdown/tree/master/data/mods/champions
 *
 * To regenerate: pnpm convert-mod -- <champ-source-dir> src/api/.../vgc/mod
 *
 * Formats registered here match config/formats.ts from the Showdown repo.
 */
import { Dex } from '@pkmn/sim';

import { Abilities } from './mod/abilities';
import { Conditions } from './mod/conditions';
import { FormatsData } from './mod/formats-data';
import { Items } from './mod/items';
import { Learnsets } from './mod/learnsets';
import { Moves } from './mod/moves';
import { Pokedex as Species } from './mod/pokedex';
import { Rulesets } from './mod/rulesets';
import { Scripts } from './mod/scripts';

let initialized = false;

export function initChampionsMod(): void {
  if (initialized) return;

  Dex.mod('champions', {
    Scripts,
    Abilities,
    Species,
    FormatsData,
    Items,
    Learnsets,
    Moves,
    Rulesets,
    Conditions,
  } as any);

  // Extend the BASE Dex format list so Dex.formats.get('gen9championsvgc2026regma')
  // and friends work globally across the app.
  Dex.formats.extend([...CHAMPIONS_FORMATS] as any[]);

  initialized = true;
}

/**
 * The format ids this mod registers, e.g. 'gen9championsvgc2026regma'.
 *
 * Used to tell an admin which values `formatId` may take when registering a
 * regulation — the sim derives the id by lowercasing the name and stripping
 * everything that is not alphanumeric.
 */
export function listChampionsFormatIds(): string[] {
  return CHAMPIONS_FORMATS.map((f) =>
    f.name.toLowerCase().replace(/[^a-z0-9]+/g, ''),
  );
}

const CHAMPIONS_FORMATS = [
    {
      name: '[Gen 9 Champions] VGC 2026 Reg M-A',
      mod: 'champions',
      gameType: 'doubles',
      bestOfDefault: true,
      ruleset: ['Flat Rules', 'VGC Timer', 'Open Team Sheets'],
    },
    {
      name: '[Gen 9 Champions] VGC 2026 Reg M-A (Bo3)',
      mod: 'champions',
      gameType: 'doubles',
      ruleset: [
        'Flat Rules',
        'VGC Timer',
        'Force Open Team Sheets',
        'Best of = 3',
      ],
    },
    {
      name: '[Gen 9 Champions] BSS Reg M-A',
      mod: 'champions',
      bestOfDefault: true,
      ruleset: ['Flat Rules', 'VGC Timer'],
    },
    {
      name: '[Gen 9 Champions] OU',
      mod: 'champions',
      ruleset: ['Standard'],
      banlist: [
        'AG',
        'Uber',
        'Moody',
        'Baton Pass',
        'Last Respects',
        'Shed Tail',
      ],
    },
    {
      name: '[Gen 9 Champions] Draft',
      mod: 'champions',
      searchShow: false,
      ruleset: ['Standard Draft'],
    },
] as const;
