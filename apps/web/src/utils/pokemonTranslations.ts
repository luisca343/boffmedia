/**
 * Utility functions for translating Pokemon-related content
 */

/**
 * Converts a move name to its translation key format
 * @param moveName - The original move name
 * @returns The formatted translation key
 */
export function getMoveTranslationKey(moveName: string): string {
  return `attack_${moveName.toLowerCase().replace(/ /g, "_")}`;
}

/**
 * Gets the translated move name using the translation function
 * @param moveName - The original move name
 * @param t - The translation function from next-intl
 * @returns The translated move name
 */
export function getTranslatedMoveName(moveName: string, t: (key: string) => string): string {
  return t(getMoveTranslationKey(moveName));
}

/**
 * Gets the translated move category using the translation function
 * @param categoryKey - The move category key (e.g., "tmMoves", "eggMoves", "tutorMoves")
 * @param t - The translation function from next-intl
 * @returns The translated move category
 */
export function getTranslatedMoveCategory(categoryKey: string, t: (key: string) => string): string {
  return t(categoryKey);
}

/** Tag namespace Pixelmon 9.4.0 uses for its spawn categories. */
const SPAWNING_TAG_PREFIX = "#pixelmon:spawning/";

/**
 * Collapses one raw spawn-condition entry to a canonical biome key.
 *
 * Three schemas reach the browser at once: 9.4.0 tag references
 * (`#pixelmon:spawning/all_forests`), 1.16.5 bare category names from the live
 * `datapack/` overlay (`all forests`), and literal ids (`minecraft:plains`).
 * Underscore is canonical - it is what 9.4.0 ships and what the i18n keys use.
 *
 * Mirrors `apps/api/.../utils/biome-keys.ts`; keep the two in step.
 */
export function normalizeBiomeKey(raw: string): string {
  const stripped = raw.startsWith(SPAWNING_TAG_PREFIX) ? raw.slice(SPAWNING_TAG_PREFIX.length) : raw;
  return stripped.includes(" ") ? stripped.split(" ").join("_") : stripped;
}

/**
 * Reads the biome list off a spawn condition regardless of schema version.
 *
 * 9.4.0 renamed `stringBiomes` to `biomes` but left `stringBiomes` on two
 * spawnInfos (both Bombirdier), and the overlay still writes it everywhere.
 */
export function readBiomeKeys(condition?: { biomes?: string[]; stringBiomes?: string[] } | null): string[] {
  return (condition?.biomes ?? condition?.stringBiomes ?? []).map(normalizeBiomeKey);
}

/**
 * Namespaces whose biomes are shown in the Pokedex.
 *
 * An allowlist, not a denylist: the packs carry spawn data for far more mods
 * than this server runs, and an unknown namespace showing up is a sign the packs
 * changed, not something to render untranslated. Bare category names (`mesas`,
 * `all_forests`) have no namespace at all and are always shown.
 *
 * - `minecraft` - vanilla.
 * - `pixelmon`  - Pixelmon's own biomes (Ultra Space and friends), not a mod.
 * - `teras`     - our own pack's village biomes; all translated.
 * - `terralith` - the one world-gen mod the server runs.
 *
 * Everything else is hidden. Notably `byg`, which the 1.16.5 map used and which
 * the live `datapack/` overlay still writes into its spawn conditions - 55 keys
 * of it. Hiding it here only masks the UI; the overlay itself still needs
 * regenerating against the Terralith world.
 */
const VISIBLE_BIOME_NAMESPACES = new Set(["minecraft", "pixelmon", "teras", "terralith"]);

/**
 * Biomes in dimensions this server has disabled.
 *
 * The Nether and the End are both off, so nothing in them is reachable and none
 * of it should appear anywhere in the Pokedex. Listed explicitly rather than
 * pattern-matched: `end` as a substring also hits `windswept_*`, `bend`,
 * `end_barrens` vs `endless`, and the two Pixelmon spawning categories
 * (`hellish`, `end`) share no common token with the biome ids they expand to.
 *
 * The two categories cover exactly the ten vanilla ids listed below - both are
 * spelled out so the set holds even if a pack redefines a tag.
 */
const HIDDEN_DIMENSION_BIOMES = new Set([
  // Pixelmon spawning categories
  "hellish",
  "end",
  // Nether
  "minecraft:nether",
  "minecraft:nether_wastes",
  "minecraft:basalt_deltas",
  "minecraft:crimson_forest",
  "minecraft:soul_sand_valley",
  "minecraft:warped_forest",
  // End
  "minecraft:the_end",
  "minecraft:small_end_islands",
  "minecraft:end_midlands",
  "minecraft:end_highlands",
  "minecraft:end_barrens",
  "minecraft:the_void",
]);

/** Whether a biome key should be rendered at all. */
export function isVisibleBiome(biome: string): boolean {
  if (HIDDEN_DIMENSION_BIOMES.has(biome)) return false;
  const colon = biome.indexOf(":");
  if (colon === -1) return true; // bare category name
  return VISIBLE_BIOME_NAMESPACES.has(biome.slice(0, colon));
}

/** Drops biomes from mods this server does not run. */
export function filterVisibleBiomes(biomes: string[]): string[] {
  return biomes.filter(isVisibleBiome);
}

/**
 * Converts a biome name to its translation key format
 * @param biomeName - The original biome name
 * @returns The formatted translation key
 */
export function getBiomeTranslationKey(biomeName: string): string {
  // `/` as well as `:` - two Terralith biomes are namespaced a level deeper
  // (`terralith:cave/fungal_caves`), and a slash inside a message key is asking
  // for trouble. Both collapse to `_`: terralith_cave_fungal_caves.
  return normalizeBiomeKey(biomeName).split(":").join("_").split("/").join("_");
}

/**
 * Gets the translated biome name using the translation function
 * @param biomeName - The original biome name
 * @param t - The translation function from next-intl
 * @returns The translated biome name, fallback to formatted original name if translation not found
 */
export function getTranslatedBiomeName(biomeName: string, t: (key: string) => string): string {
  const translationKey = getBiomeTranslationKey(biomeName);
  const translated = t(translationKey);
  
  // If translation is the same as the key, it means translation wasn't found
  // Return formatted original name as fallback
  if (translated === translationKey) {
    return biomeName.replace(/:/g, " ");
  }
  
  return translated;
}
