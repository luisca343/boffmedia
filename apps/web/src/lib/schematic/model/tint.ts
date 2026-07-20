/**
 * Biome / state tint for `tintindex` faces.
 *
 * Minecraft multiplies grayscale grass/foliage/water/redstone textures by a color
 * computed from the world biome at render time. A schematic has no biome data, so
 * we apply fixed, representative colors keyed by block family — this is what turns
 * `grass_block_top.png` (a gray texture) into the green the user expects.
 *
 * Returns a `#rrggbb` string to multiply the texture by, or a neutral white when
 * the block family isn't recognised (a tinted face we can't classify renders
 * untinted rather than wrongly colored).
 */

type States = Record<string, string>;

const GRASS = "#7cbd6b"; // plains grass
const FOLIAGE = "#59ae30"; // default foliage (oak/jungle/acacia/dark_oak/birch share visually)
const SPRUCE = "#619961";
const BIRCH = "#80a755";
const WATER = "#3f76e4";
const LILY_PAD = "#208030";
const STEM = "#80a755";
const WHITE = "#ffffff";

/** Bare name without namespace. */
function bareName(blockId: string): string {
  const i = blockId.indexOf(":");
  return i === -1 ? blockId : blockId.slice(i + 1);
}

/** Redstone wire brightens with power (0 → dark red, 15 → bright red). */
function redstoneColor(states: States): string {
  const power = Math.max(0, Math.min(15, parseInt(states.power ?? "0", 10) || 0));
  const r = Math.round(75 + (255 - 75) * (power / 15));
  return `#${r.toString(16).padStart(2, "0")}0000`;
}

/**
 * Tint color for a block's `tintindex` faces. `states` is consulted for blocks
 * whose tint depends on state (redstone power).
 */
export function tintColor(blockId: string, states: States): string {
  const name = bareName(blockId);

  if (name === "redstone_wire") return redstoneColor(states);
  if (name === "lily_pad") return LILY_PAD;
  if (name === "water" || name === "water_cauldron" || name === "bubble_column") return WATER;

  if (name.endsWith("_stem") || name.endsWith("_stem_connected") || name === "attached_melon_stem" || name === "attached_pumpkin_stem")
    return STEM;

  if (name.includes("spruce_leaves")) return SPRUCE;
  if (name.includes("birch_leaves")) return BIRCH;
  if (name.endsWith("_leaves") || name === "vine" || name === "mangrove_leaves") return FOLIAGE;

  if (
    name === "grass_block" ||
    name === "short_grass" ||
    name === "grass" ||
    name === "tall_grass" ||
    name === "fern" ||
    name === "large_fern" ||
    name === "sugar_cane" ||
    name === "potted_fern"
  )
    return GRASS;

  return WHITE;
}
