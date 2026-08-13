/**
 * Pre-flattening asset compatibility.
 *
 * The legacy loader emits *modern* block ids and *modern* properties — the
 * WorldEdit table maps `44:8` to `minecraft:stone_slab[type=top]`. Geometry for a
 * 1.12 schematic, however, is read from the mirror's 1.12.2 tree, and that tree
 * is only half-flattened: the file *names* are mostly modern
 * (`stone_slab.json`, `red_sandstone_slab.json`) but the variant keys inside kept
 * the 1.12 *property* names. A slab is keyed `half=bottom|top`, never `type`.
 *
 * Asking for `type=top` therefore matched no variant, and the resolver's
 * last-resort "first declared variant" produced the bottom slab for every slab in
 * the schematic. Renaming the property here is what makes top slabs top.
 *
 * `type=double` is a second, distinct problem: 1.12 modelled a double slab as a
 * *separate block* (`stone_double_slab.json`), so there is no double variant to
 * find under `stone_slab` at all.
 */

/**
 * Blocks whose 1.12 blockstate file is *not* named after the modern block, and
 * which the generated `1.12-assets.json` alias table does not cover because the
 * mapping is only unambiguous once the slab family is taken into account.
 */
const LEGACY_SLAB_NAMES: Record<string, string> = {
  "minecraft:petrified_oak_slab": "minecraft:wood_old_slab",
};

function isSlab(id: string): boolean {
  return id.endsWith("_slab");
}

/**
 * Rewrite a block id + states into the form the 1.12.2 asset tree actually uses.
 * Returns the input unchanged for anything it has no rule for.
 */
export function adaptToLegacyAssets(
  blockId: string,
  states: Record<string, string>,
): { blockId: string; states: Record<string, string> } {
  if (!isSlab(blockId)) return { blockId, states };

  const base = LEGACY_SLAB_NAMES[blockId] ?? blockId;

  if (states.type === "double") {
    // A 1.12 double slab is its own block and its own full-cube model; the slab
    // half-property is meaningless there, so it is dropped rather than renamed.
    const { type: _dropped, ...rest } = states;
    return { blockId: base.replace(/_slab$/, "_double_slab"), states: rest };
  }

  if (states.type === "top" || states.type === "bottom") {
    const { type, ...rest } = states;
    return { blockId: base, states: { ...rest, half: type } };
  }

  return { blockId: base, states };
}
