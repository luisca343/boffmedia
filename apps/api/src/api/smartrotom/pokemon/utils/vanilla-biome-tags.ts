/**
 * Vanilla biome tags that Pixelmon's spawning tags reference but no extracted
 * pack provides.
 *
 * `default_datapack_9.4.0` is `jar:data/**` of the Pixelmon jar. The jar carries
 * `data/pixelmon/tags/worldgen/biome/spawning/*.json`, and those files reference
 * six tags that live in the *Minecraft* jar (`#minecraft:is_*`) and in the
 * NeoForge common-tags jar (`#c:is_cave`). Neither jar is on disk.
 *
 * The gap is load-bearing, not cosmetic — five categories have **zero** literal
 * vanilla biomes of their own and would resolve empty:
 *
 *   oceanic     0 literal  → `#minecraft:is_ocean` only
 *   mesas       0 literal  → `#minecraft:is_badlands` only
 *   savannas    0 literal  → `#minecraft:is_savanna` only
 *   jungles     0 literal  → `#minecraft:is_jungle` only
 *   caves       0 literal  → `#c:is_cave` only
 *   all_forests 3 literal  → loses ~11 more to `#minecraft:is_forest`
 *
 * This table is a FALLBACK, consulted only for tags no loaded pack defines. Drop
 * a real `data/minecraft/tags/worldgen/biome/**` into any pack and it wins.
 *
 * Source: Minecraft 1.21.1 `data/minecraft/tags/worldgen/biome/*.json` and
 * NeoForge 1.21.1 common tags (`Tags.Biomes.IS_CAVE`). These are stable within a
 * Minecraft version — re-verify when the packs move off 1.21.1.
 */

/** Minecraft version these tag contents were taken from. */
export const VANILLA_BIOME_TAGS_MC_VERSION = '1.21.1';

/**
 * Tag id → its `values`, in datapack syntax. `#` entries are left in place on
 * purpose so the resolver's own transitive expansion handles them, rather than
 * this table pre-flattening (`is_ocean` nesting `is_deep_ocean` is the case the
 * migration handoff called out).
 */
export const VANILLA_BIOME_TAGS: Readonly<Record<string, readonly string[]>> = {
  'minecraft:is_forest': [
    'minecraft:forest',
    'minecraft:flower_forest',
    'minecraft:birch_forest',
    'minecraft:old_growth_birch_forest',
    'minecraft:dark_forest',
    'minecraft:grove',
    'minecraft:taiga',
    'minecraft:snowy_taiga',
    'minecraft:old_growth_pine_taiga',
    'minecraft:old_growth_spruce_taiga',
    'minecraft:windswept_forest',
  ],
  'minecraft:is_ocean': [
    '#minecraft:is_deep_ocean',
    'minecraft:frozen_ocean',
    'minecraft:ocean',
    'minecraft:cold_ocean',
    'minecraft:lukewarm_ocean',
    'minecraft:warm_ocean',
  ],
  'minecraft:is_deep_ocean': [
    'minecraft:deep_frozen_ocean',
    'minecraft:deep_cold_ocean',
    'minecraft:deep_ocean',
    'minecraft:deep_lukewarm_ocean',
  ],
  'minecraft:is_badlands': [
    'minecraft:badlands',
    'minecraft:eroded_badlands',
    'minecraft:wooded_badlands',
  ],
  'minecraft:is_jungle': [
    'minecraft:bamboo_jungle',
    'minecraft:jungle',
    'minecraft:sparse_jungle',
  ],
  'minecraft:is_savanna': [
    'minecraft:savanna',
    'minecraft:savanna_plateau',
    'minecraft:windswept_savanna',
  ],
  // NeoForge convention tag, not a vanilla one.
  'c:is_cave': [
    'minecraft:deep_dark',
    'minecraft:dripstone_caves',
    'minecraft:lush_caves',
  ],
};
