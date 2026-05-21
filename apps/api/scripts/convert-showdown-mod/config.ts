/**
 * Configuration for the Showdown → @pkmn/sim mod converter.
 *
 * Each entry maps a Showdown mod file name to the corresponding PKMN/PS
 * output config, including the @pkmn/sim type name, output file name, and
 * whether the file should appear in the generated index.ts barrel.
 *
 * Determined from:
 *   @pkmn/sim build/cjs/sim/index.d.ts
 *   @pkmn/sim build/cjs/sim/exported-global-types.d.ts
 */

export interface FileConfig {
  /** The exported constant name expected in the Showdown source file. */
  exportName: string;
  /**
   * The @pkmn/sim type that annotates this export.
   * Used as fallback when the source has no type annotation or an unresolvable one.
   */
  pkmnType: string;
  /** Output file name (relative to the output directory). */
  outputFile: string;
  /** Whether this export is included in the generated index.ts barrel. */
  inIndex: boolean;
  /**
   * When set, the index.ts barrel re-exports this as a different name.
   * e.g. Pokedex → `export {Pokedex as Species} from './pokedex'`
   */
  indexExportAs?: string;
  /** Optional note added as a comment in the generated file. */
  note?: string;
}

/**
 * Maps a Showdown mod file base name to its PKMN/PS conversion config.
 * Add new entries here when new Showdown data table types are introduced.
 */
export const FILE_CONFIGS: Readonly<Record<string, FileConfig>> = {
  'abilities.ts': {
    exportName: 'Abilities',
    pkmnType: 'ModdedAbilityDataTable',
    outputFile: 'abilities.ts',
    inIndex: true,
  },
  'conditions.ts': {
    exportName: 'Conditions',
    pkmnType: 'ModdedConditionDataTable',
    outputFile: 'conditions.ts',
    inIndex: false,
    note: 'Conditions are not part of the standard @pkmn/sim mod index. Register manually if needed.',
  },
  'formats-data.ts': {
    exportName: 'FormatsData',
    pkmnType: 'ModdedSpeciesFormatsDataTable',
    outputFile: 'formats-data.ts',
    inIndex: true,
  },
  'items.ts': {
    exportName: 'Items',
    pkmnType: 'ModdedItemDataTable',
    outputFile: 'items.ts',
    inIndex: true,
  },
  'learnsets.ts': {
    exportName: 'Learnsets',
    pkmnType: 'ModdedLearnsetDataTable',
    outputFile: 'learnsets.ts',
    inIndex: true,
  },
  'moves.ts': {
    exportName: 'Moves',
    pkmnType: 'ModdedMoveDataTable',
    outputFile: 'moves.ts',
    inIndex: true,
  },
  'pokedex.ts': {
    exportName: 'Pokedex',
    pkmnType: 'ModdedSpeciesDataTable',
    outputFile: 'pokedex.ts',
    inIndex: true,
    indexExportAs: 'Species',
  },
  'rulesets.ts': {
    exportName: 'Rulesets',
    pkmnType: 'ModdedFormatDataTable',
    outputFile: 'rulesets.ts',
    inIndex: false,
    note: 'Rulesets are not part of the standard @pkmn/sim mod index. Register manually if needed.',
  },
  'scripts.ts': {
    exportName: 'Scripts',
    pkmnType: 'ModdedBattleScriptsData',
    outputFile: 'scripts.ts',
    inIndex: true,
  },
};

/**
 * Named types that are exported from '@pkmn/sim' (including via
 * `exported-global-types`). Used to automatically add extra import entries
 * for any types referenced inside method/function bodies of the source file.
 *
 * Update this set when new types are added to @pkmn/sim.
 */
export const PKMN_SIM_EXPORTED_TYPES: ReadonlySet<string> = new Set([
  // Table types (all Modded* variants from the individual dex-*.d.ts files)
  'ModdedAbilityDataTable',
  'ModdedConditionDataTable',
  'ModdedFormatDataTable',
  'ModdedItemDataTable',
  'ModdedLearnsetDataTable',
  'ModdedMoveDataTable',
  'ModdedSpeciesDataTable',
  'ModdedSpeciesFormatsDataTable',
  'ModdedLearnsetData',
  // Scripts / actions
  'ModdedBattleScriptsData',
  'ModdedBattleActions',
  'ModdedBattlePokemon',
  'ModdedBattleSide',
  'ModdedBattleQueue',
  'ModdedField',
  // Runtime types (exported-global-types.d.ts)
  'Battle',
  'BattleActions',
  'BattleQueue',
  'Pokemon',
  'Side',
  'Field',
  'ActiveMove',
  'Move',
  'Effect',
  'Condition',
  'Species',
  'Format',
  'AnyObject',
  'ID',
  'IDEntry',
  'GameType',
  'GenderName',
  'StatID',
  'StatIDExceptHP',
  'StatsTable',
  'SparseStatsTable',
  'BoostID',
  'BoostsTable',
  'Nonstandard',
  'PokemonSet',
  'EffectType',
  'EffectData',
  'ModdedEffectData',
  'EventInfo',
  'CommonHandlers',
]);

/**
 * Ordered list of index.ts entries. The order follows the convention used in
 * the @pkmn/sim gen9predlc reference mod (alphabetical by export name).
 */
export const INDEX_EXPORT_ORDER: ReadonlyArray<string> = [
  'abilities.ts',
  'formats-data.ts',
  'items.ts',
  'learnsets.ts',
  'moves.ts',
  'pokedex.ts',
  'scripts.ts',
];
