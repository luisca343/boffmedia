/**
 * Conversion policy for fluids: which prefab `fluids[]` entry a converted engine
 * block becomes. The neutral naming bridge it builds on (`Fluid_<Base>` ↔
 * `<Base>_Source` / `<Base>`) is shared engine data and lives in
 * `@/lib/schematic/fluids`.
 */
import { hytaleFluidBase, SOURCE_SUFFIX } from "@/lib/schematic/fluids";

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
