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
 * truth for that bridge, shared by the loader, the writer and the 3D preview.
 */

/** The block-type prefix every Hytale fluid shares (`Fluid_Water`, `Fluid_Lava`…). */
const FLUID_BLOCK_PREFIX = "Fluid_";
/** The `_Source` suffix that marks a fluid *source* variant in a prefab. */
const SOURCE_SUFFIX = "_Source";

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

export interface FluidPlacement {
  /** Prefab `fluids[].name` — `<Base>_Source` (source) or `<Base>` (flowing). */
  name: string;
  /** Prefab `fluids[].level` — 1 for a source, 1–8 for flowing (8 = full). */
  level: number;
}

const clampLevel = (n: number): number => Math.max(1, Math.min(8, n));

/**
 * The prefab `fluids[]` `{ name, level }` for an engine fluid block, or null when
 * the block isn't a fluid. States are consulted in priority order:
 *   1. `fluidSource` / `fluidLevel` — exact values from a loaded Hytale prefab,
 *      so a Hytale→Hytale round-trip is lossless.
 *   2. `level` — a Minecraft water/lava level that survived conversion
 *      (0 = source; 1–7 flowing, 1 highest; ≥8 falling).
 *   3. none — default to a *source* block, the overwhelmingly common case for
 *      pooled/still water in a Minecraft schematic (and what makes the result
 *      behave like real water rather than a static block).
 * Sources always emit as `<Base>_Source` at level 1, matching every Hytale prefab.
 */
export function fluidPlacement(name: string, states: Record<string, string>): FluidPlacement | null {
  const base = hytaleFluidBase(name);
  if (base === null) return null;

  if (states.fluidSource !== undefined || states.fluidLevel !== undefined) {
    if (states.fluidSource === "1") return { name: `${base}${SOURCE_SUFFIX}`, level: 1 };
    const lvl = parseInt(states.fluidLevel ?? "8", 10);
    return { name: base, level: Number.isNaN(lvl) ? 8 : clampLevel(lvl) };
  }

  const mc = states.level !== undefined ? parseInt(states.level, 10) : NaN;
  if (!Number.isNaN(mc)) {
    if (mc <= 0) return { name: `${base}${SOURCE_SUFFIX}`, level: 1 };
    if (mc >= 8) return { name: base, level: 8 };
    return { name: base, level: clampLevel(8 - mc) };
  }

  return { name: `${base}${SOURCE_SUFFIX}`, level: 1 };
}

/** Representative translucent fill colors for the 3D preview, keyed by base name. */
const FLUID_COLORS: Record<string, string> = {
  Water: "#3f76e4", // matches the biome water tint used elsewhere
  Lava: "#ea5a10",
  Poison: "#5aa02c",
  Slime: "#7cbd6b",
  Slime_Red: "#c0392b",
  Tar: "#141414",
};

/** Bare name without a `minecraft:`/`hytale:` namespace. */
function bareName(blockId: string): string {
  const i = blockId.indexOf(":");
  return i === -1 ? blockId : blockId.slice(i + 1);
}

/**
 * Translucent fill color for a fluid block id in either game — `minecraft:water`
 * / `minecraft:lava` or a Hytale `Fluid_*` — or null for a non-fluid block. Used
 * by the preview to render fluids as translucent volumes instead of the opaque
 * cube (whose Minecraft water has no `water.png` and renders as a stray
 * placeholder tile, and whose Hytale water renders white).
 */
export function fluidColor(blockId: string): string | null {
  const name = bareName(blockId);
  if (name === "water") return FLUID_COLORS.Water;
  if (name === "lava") return FLUID_COLORS.Lava;
  const base = hytaleFluidBase(name);
  return base ? (FLUID_COLORS[base] ?? FLUID_COLORS.Water) : null;
}
