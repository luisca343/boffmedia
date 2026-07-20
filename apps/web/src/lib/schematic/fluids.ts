/**
 * Fluids are not blocks in Hytale.
 *
 * A Hytale `.prefab.json` stores fluids in a **separate top-level `fluids`
 * array** — never in `blocks` — and each entry is a *variant* name plus a level:
 *   { "x":…, "y":…, "z":…, "name":"Water_Source", "level":1 }   // a source cell
 *   { "x":…, "y":…, "z":…, "name":"Water",        "level":8 }   // flowing, full
 * (verified in hytale-shared-source: `Fluid.convertLegacyName` maps the block
 * type `Fluid_Water` → `Water_Source` at level 0, else `Water`; the engine's
 * `FluidState` uses SOURCE_LEVEL 0 / FULL_LEVEL 8, and real prefabs always write
 * sources as `<Base>_Source` at level 1 and flowing fluid at level 1–8.)
 *
 * Writing a fluid into the `blocks` array instead makes Hytale treat it as a
 * solid, static block named e.g. `Fluid_Water` — which is exactly the "solid,
 * not real water" bug this module exists to prevent.
 *
 * In the engine's neutral model a fluid rides along as an ordinary palette block
 * whose name is `Fluid_<Base>` (matching Hytale's
 * `Server/BlockTypeList/Fluids.json`), so it occupies a cell, renders, and
 * round-trips like any other block. The prefab loader/writer translate that
 * to/from the `fluids` array at the edges. This module is the single source of
 * truth for that bridge, shared by the loader, the registry and the 3D preview.
 *
 * Only the *naming* bridge lives here; deciding which `{ name, level }` a
 * converted block becomes is a conversion policy and stays with the tool.
 */

/** The block-type prefix every Hytale fluid shares (`Fluid_Water`, `Fluid_Lava`…). */
export const FLUID_BLOCK_PREFIX = "Fluid_";
/** The `_Source` suffix that marks a fluid *source* variant in a prefab. */
export const SOURCE_SUFFIX = "_Source";

/** The Hytale fluid block types, from `Server/BlockTypeList/Fluids.json`. */
export const HYTALE_FLUID_BLOCKS = [
  "Fluid_Water",
  "Fluid_Lava",
  "Fluid_Poison",
  "Fluid_Slime",
  "Fluid_Slime_Red",
  "Fluid_Tar",
] as const;

/** Base fluid name for a Hytale fluid block (`Fluid_Water` → `Water`), or null. */
export function hytaleFluidBase(name: string): string | null {
  return name.startsWith(FLUID_BLOCK_PREFIX) && name.length > FLUID_BLOCK_PREFIX.length
    ? name.slice(FLUID_BLOCK_PREFIX.length)
    : null;
}

/** True for a Hytale fluid block name (`Fluid_*`). */
export function isHytaleFluidName(name: string): boolean {
  return hytaleFluidBase(name) !== null;
}

/**
 * Parse a prefab `fluids[].name` into the neutral `Fluid_<Base>` block name plus
 * whether it's a source variant:
 *   "Water_Source" → { block:"Fluid_Water", base:"Water", source:true }
 *   "Water"        → { block:"Fluid_Water", base:"Water", source:false }
 */
export function parsePrefabFluidName(name: string): { block: string; base: string; source: boolean } {
  const source = name.endsWith(SOURCE_SUFFIX) && name.length > SOURCE_SUFFIX.length;
  const base = source ? name.slice(0, -SOURCE_SUFFIX.length) : name;
  return { block: `${FLUID_BLOCK_PREFIX}${base}`, base, source };
}
