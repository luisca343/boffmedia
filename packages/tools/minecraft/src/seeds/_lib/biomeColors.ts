/**
 * biomeColors.ts — what colour a biome is drawn in, and what it is called.
 *
 * Three sources, in priority order:
 *
 * 1. **The pack.** `data/c/worldgen/biome_colors.json` is a community
 *    convention (`c` being the cross-loader "common" namespace) that map tools
 *    read and pack authors write. Terralith ships 94 entries carrying both an
 *    RGB colour and a display name. A colour the pack's own author chose beats
 *    anything we could invent, so this always wins.
 * 2. **The vanilla table below**, for the 53 vanilla biomes plus a few
 *    variants. Vanilla ships no colour file of its own — Minecraft's biome
 *    colours live in the client, not in worldgen data — so somebody has to
 *    supply them.
 * 3. **A hash of the id**, for anything left over. Deliberately kept: a pack
 *    with no colour file still renders as a legible map instead of a grey
 *    field, and the colour is stable across seeds and runs so two maps stay
 *    comparable.
 *
 * The vanilla table is taken from jacobsjo/mc-datapack-map
 * (`vanilla_datapack_base/data/c/worldgen/biome_colors.json`, MIT). Using
 * *those* values rather than picking our own is the point: map.jacobsjo.eu is
 * the reference the seedtool README tells you to eyeball a seed against, and
 * that comparison is only worth doing if both sides paint the same world the
 * same way.
 */

/** `[r, g, b]`, 0-255. A tuple rather than an object — this is read per pixel. */
export type Rgb = readonly [number, number, number];

/** A biome's presentation: its colour, and the name a human should see. */
export interface BiomeStyle {
  readonly color: Rgb;
  /** The pack's display name where it gave one, else the id's last segment. */
  readonly label: string;
  readonly source: "pack" | "vanilla" | "hash";
}

/**
 * Vanilla biome colours, from jacobsjo/mc-datapack-map (MIT).
 * Not exhaustive over every namespace — only `minecraft:` ids appear here.
 */
export const VANILLA_BIOME_COLORS: Readonly<Record<string, Rgb>> = {
  "minecraft:badlands": [255, 111, 0],
  "minecraft:bamboo_jungle": [0, 255, 87],
  "minecraft:basalt_deltas": [79, 73, 66],
  "minecraft:beach": [255, 249, 138],
  "minecraft:birch_forest": [106, 198, 91],
  "minecraft:cherry_grove": [220, 138, 221],
  "minecraft:cold_ocean": [0, 123, 255],
  "minecraft:crimson_forest": [219, 60, 46],
  "minecraft:dark_forest": [1, 116, 1],
  "minecraft:deep_cold_ocean": [0, 71, 133],
  "minecraft:deep_dark": [8, 39, 31],
  "minecraft:deep_frozen_ocean": [52, 120, 162],
  "minecraft:deep_lukewarm_ocean": [38, 0, 143],
  "minecraft:deep_ocean": [3, 0, 158],
  "minecraft:desert": [255, 255, 0],
  "minecraft:dripstone_caves": [140, 124, 0],
  "minecraft:end_barrens": [199, 204, 137],
  "minecraft:end_highlands": [112, 117, 46],
  "minecraft:end_midlands": [170, 179, 55],
  "minecraft:eroded_badlands": [184, 80, 0],
  "minecraft:flower_forest": [119, 188, 1],
  "minecraft:forest": [0, 153, 3],
  "minecraft:frozen_ocean": [32, 175, 255],
  "minecraft:frozen_peaks": [222, 222, 222],
  "minecraft:frozen_river": [166, 212, 255],
  "minecraft:grove": [175, 175, 228],
  "minecraft:ice_spikes": [200, 238, 254],
  "minecraft:jagged_peaks": [215, 172, 211],
  "minecraft:jungle": [0, 255, 0],
  "minecraft:lukewarm_ocean": [76, 0, 255],
  "minecraft:lush_caves": [112, 255, 79],
  "minecraft:mangrove_swamp": [39, 84, 66],
  "minecraft:meadow": [210, 255, 61],
  "minecraft:mushroom_fields": [250, 145, 248],
  "minecraft:nether_wastes": [163, 62, 62],
  "minecraft:ocean": [0, 0, 255],
  "minecraft:old_growth_birch_forest": [89, 228, 90],
  "minecraft:old_growth_pine_taiga": [68, 77, 0],
  "minecraft:old_growth_spruce_taiga": [52, 80, 17],
  "minecraft:pale_garden": [144, 144, 144],
  "minecraft:plains": [115, 228, 63],
  "minecraft:river": [77, 130, 255],
  "minecraft:savanna": [179, 242, 61],
  "minecraft:savanna_plateau": [128, 171, 48],
  "minecraft:small_end_islands": [234, 247, 52],
  "minecraft:snowy_beach": [214, 218, 170],
  "minecraft:snowy_plains": [255, 255, 255],
  "minecraft:snowy_slopes": [138, 202, 234],
  "minecraft:snowy_taiga": [209, 255, 211],
  "minecraft:soul_sand_valley": [140, 132, 108],
  "minecraft:sparse_jungle": [128, 255, 0],
  "minecraft:stony_peaks": [173, 191, 225],
  "minecraft:stony_shore": [102, 102, 102],
  "minecraft:sulfur_caves": [234, 214, 35],
  "minecraft:sunflower_plains": [166, 255, 0],
  "minecraft:swamp": [93, 187, 142],
  "minecraft:taiga": [69, 113, 25],
  "minecraft:the_end": [252, 244, 121],
  "minecraft:the_void": [0, 0, 0],
  "minecraft:warm_ocean": [100, 0, 255],
  "minecraft:warped_forest": [68, 171, 171],
  "minecraft:windswept_forest": [66, 123, 95],
  "minecraft:windswept_gravelly_hills": [129, 150, 152],
  "minecraft:windswept_hills": [105, 142, 145],
  "minecraft:windswept_savanna": [171, 219, 81],
  "minecraft:wooded_badlands": [219, 139, 0],};

/**
 * Stable pseudo-random colour per id (FNV-1a → HSL). Saturation and lightness
 * are held in a mid band rather than spanning the full range, so a fallback
 * colour never comes out near-black or near-white and stays distinguishable
 * against the authored palette around it.
 */
export function hashedColor(id: string): Rgb {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = (h >>> 0) % 360;
  const sat = 0.45 + (((h >>> 9) & 63) / 63) * 0.35;
  const lig = 0.35 + (((h >>> 17) & 63) / 63) * 0.3;
  return hslToRgb(hue / 360, sat, lig);
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/** `minecraft:snowy_slopes` → `Snowy slopes`, for ids the pack did not name. */
function labelFromId(id: string): string {
  const path = id.slice(id.indexOf(":") + 1).replace(/_/g, " ");
  return path.charAt(0).toUpperCase() + path.slice(1);
}

/** One entry of a pack's `biome_colors.json`. `name` is optional in the wild. */
interface PackColorEntry {
  r?: number;
  g?: number;
  b?: number;
  name?: string;
}

export type PackColors = Readonly<Record<string, PackColorEntry>>;

/**
 * Every path that is a biome-colour file, in either layout:
 * `data/c/worldgen/biome_colors.json` (current) and `data/<ns>/biome_colors.json`
 * (older, still shipped by some packs).
 */
const BIOME_COLORS_PATH = /^data\/[a-z0-9_.-]+\/(?:worldgen\/)?biome_colors\.json$/;

/**
 * Pull every biome-colour file out of a loaded pack stack and merge them.
 *
 * `PackStack` has already resolved overrides, so iterating its paths gives the
 * winning copy of each file. The merge is per *biome*, not per file, so a pack
 * that colours only its own biomes adds to the table rather than replacing it —
 * which is what lets Terralith's 94 entries and the vanilla table coexist.
 */
export function readPackColors(stack: {
  paths(): IterableIterator<string>;
  json(rel: string): unknown;
}): PackColors {
  const out: Record<string, PackColorEntry> = {};
  for (const rel of stack.paths()) {
    if (!BIOME_COLORS_PATH.test(rel)) continue;
    const json = stack.json(rel);
    if (json && typeof json === "object") Object.assign(out, json);
  }
  return out;
}

/**
 * Resolves ids to colours, caching as it goes.
 *
 * The cache is why this is a factory and not a bare function: every tile
 * carries its own biome palette (`sampleGrid` numbers biomes per call), so the
 * same id is resolved once per tile across a whole map. Hashing a string and
 * converting HSL for each of those, on every repaint, is real work for an
 * answer that cannot change while the pack stack is fixed.
 */
export interface BiomeStyler {
  styleOf(id: string): BiomeStyle;
  /** Styles for one tile's palette, in palette-index order. */
  stylesFor(palette: readonly string[]): BiomeStyle[];
}

export function createBiomeStyler(packColors: PackColors = {}): BiomeStyler {
  const cache = new Map<string, BiomeStyle>();

  const styleOf = (id: string): BiomeStyle => {
    const hit = cache.get(id);
    if (hit) return hit;

    const fromPack = packColors[id];
    const label = fromPack?.name ?? labelFromId(id);
    let style: BiomeStyle;

    if (
      fromPack &&
      typeof fromPack.r === "number" &&
      typeof fromPack.g === "number" &&
      typeof fromPack.b === "number"
    ) {
      style = { color: [fromPack.r, fromPack.g, fromPack.b], label, source: "pack" };
    } else {
      const vanilla = VANILLA_BIOME_COLORS[id];
      style = vanilla
        ? { color: vanilla, label, source: "vanilla" }
        : { color: hashedColor(id), label, source: "hash" };
    }

    cache.set(id, style);
    return style;
  };

  return { styleOf, stylesFor: (palette) => palette.map(styleOf) };
}
