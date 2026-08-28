/**
 * Biome key normalisation, shared by every read site of `spawnInfo.condition`.
 *
 * Three schemas have to collapse onto one key space:
 *
 * | source                          | example                        |
 * |---------------------------------|--------------------------------|
 * | Pixelmon 9.4.0 default pack     | `#pixelmon:spawning/all_forests` |
 * | Pixelmon 1.16.5 (live overlay)  | `all forests`                  |
 * | any pack, literal biome         | `minecraft:plains`             |
 *
 * The overlay `datapack/` is still 1.16.5-shaped and overrides ~322 of the
 * 9.4.0 files by filename, so both spellings are live at once. Without the
 * space→underscore fold, `all forests` and `all_forests` become two separate
 * biomes in the index and two duplicate cards on /localizacion.
 *
 * Underscore is the canonical form: it is what 9.4.0 ships and what the web's
 * `getBiomeTranslationKey()` already derives, so existing i18n keys keep working.
 */

/** Tag namespace Pixelmon uses for its own spawn categories. */
export const SPAWNING_TAG_PREFIX = '#pixelmon:spawning/';

/**
 * Collapse one raw condition entry to a canonical biome key.
 * Category references become bare underscore names; literal `namespace:id`
 * biomes are passed through untouched.
 */
export function normalizeBiomeKey(raw: string): string {
  const stripped = raw.startsWith(SPAWNING_TAG_PREFIX)
    ? raw.slice(SPAWNING_TAG_PREFIX.length)
    : raw;

  // Only category names carry spaces; literal ids never do.
  return stripped.includes(' ') ? stripped.split(' ').join('_') : stripped;
}

/**
 * Read the biome list off a spawn condition regardless of schema version.
 *
 * 9.4.0 renamed `stringBiomes` → `biomes` but kept `stringBiomes` on two
 * spawnInfos (both Bombirdier, `standard/bombirdier.set.json`), and the live
 * overlay still writes `stringBiomes` everywhere. Reading only one key silently
 * drops data instead of throwing.
 */
export function readBiomeKeys(condition?: {
  biomes?: string[];
  stringBiomes?: string[];
}): string[] {
  const raw = condition?.biomes ?? condition?.stringBiomes ?? [];
  return raw.map(normalizeBiomeKey);
}
