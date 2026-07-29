import * as THREE from "three";
import { placeholderColor } from "../textures/blockTexture";

/**
 * Pre-flattening metadata carried on a block, or undefined.
 *
 * The legacy loaders keep a modded block's `id:meta` variant verbatim in
 * `states.meta` (the property it maps to lives in the mod's Java, not its
 * assets), and it is what selects the block's variant texture.
 */
export function metaOf(states: Record<string, string> | undefined): number | undefined {
  const raw = states?.meta;
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
import type { RenderKind } from "./render-plan";

const CHANGED_GLOW = "#22c55e"; // green — this block was converted
const PROBLEM_GLOW = "#ef4444"; // red — unresolved (missing / mod-only)

const GHOST_TEXTURED = "#7c8896";
const GHOST_FLAT = "#3f4754";

export interface StyleParams {
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  ghost: boolean;
}

/**
 * Render-kind → overlay material params (glow / ghosting), independent of texture.
 *  - normal  : source-mode look — glow only when selected.
 *  - changed : converted target block — green glow so it stands out.
 *  - problem : unresolved block — red glow, it has no valid target yet.
 *  - ghost   : untouched block in converted mode — muted + translucent.
 * A selected block is always forced solid and brightly lit so it's findable.
 */
export function styleParams(kind: RenderKind, isSelected: boolean): StyleParams {
  if (isSelected) {
    const emissive = kind === "problem" ? PROBLEM_GLOW : kind === "changed" ? CHANGED_GLOW : "#ffffff";
    return { emissive, emissiveIntensity: 0.65, transparent: false, opacity: 1, depthWrite: true, ghost: false };
  }
  switch (kind) {
    case "ghost":
      return { emissive: "#000000", emissiveIntensity: 0, transparent: true, opacity: 0.3, depthWrite: false, ghost: true };
    case "changed":
      return { emissive: CHANGED_GLOW, emissiveIntensity: 0.35, transparent: false, opacity: 1, depthWrite: true, ghost: false };
    case "problem":
      return { emissive: PROBLEM_GLOW, emissiveIntensity: 0.5, transparent: false, opacity: 1, depthWrite: true, ghost: false };
    default:
      return { emissive: "#000000", emissiveIntensity: 0, transparent: false, opacity: 1, depthWrite: true, ghost: false };
  }
}

/** Base colour a block is drawn in when it has no usable texture, or is ghosted. */
export function surfaceColor(
  blockId: string,
  hasTexture: boolean,
  tint: string | null,
  ghost: boolean,
): string {
  if (ghost) return hasTexture ? GHOST_TEXTURED : GHOST_FLAT;
  return hasTexture ? (tint ?? "#ffffff") : (tint ?? placeholderColor(blockId));
}

/** Build one MeshStandardMaterial for a face group (or the whole cube fallback). */
export function makeMaterial(
  texture: THREE.Texture | null,
  tint: string | null,
  doubleSided: boolean,
  overlay: boolean,
  sp: StyleParams,
  blockId: string,
): THREE.MeshStandardMaterial {
  const hasTex = !!texture;
  return new THREE.MeshStandardMaterial({
    map: texture ?? undefined,
    color: new THREE.Color(surfaceColor(blockId, hasTex, tint, sp.ghost)),
    emissive: new THREE.Color(sp.emissive),
    emissiveIntensity: sp.emissiveIntensity,
    transparent: sp.transparent,
    opacity: sp.opacity,
    depthWrite: sp.depthWrite,
    // Cut out transparent texels (glass, panes, plants); no-op on opaque textures.
    alphaTest: hasTex && !sp.ghost ? 0.5 : 0,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    // Coplanar overlays (grass side fringe) draw just in front to avoid z-fighting.
    polygonOffset: overlay,
    polygonOffsetFactor: overlay ? -1 : 0,
    polygonOffsetUnits: overlay ? -1 : 0,
    roughness: 0.85,
    metalness: 0,
  });
}
