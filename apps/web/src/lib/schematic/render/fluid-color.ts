import { hytaleFluidBase } from "../fluids";

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
