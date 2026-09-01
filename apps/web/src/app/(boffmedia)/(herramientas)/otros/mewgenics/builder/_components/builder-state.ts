// Shared vocabulary for the cat builder: the edited state, the slot tables the
// stage/rail/drawer all index by, and the hash codec.
//
// One module rather than per-component constants because the slot list is the
// spine of the whole screen — the rail renders it, the drawer opens on one of
// its entries, and randomize writes every one of them. Three copies drifted.

import { MEW_DEFAULT_CAT_PARTS, MEW_DEFAULT_PALETTE } from "@/components/boffmedia/ui/mewgenics/cat"
import type { CatParts } from "@/components/boffmedia/ui/mewgenics/cat"

export const DEFAULT_CAT: CatParts = MEW_DEFAULT_CAT_PARTS
export const DEFAULT_PALETTE = MEW_DEFAULT_PALETTE

export type PartSlot =
  | "body" | "head" | "ears" | "eyes" | "eyebrows" | "mouth"
  | "tail" | "legs" | "arms" | "texture"

export type EquipSlot = "head" | "face" | "neck" | "weapon" | "trinket"

export interface BuilderState {
  parts: CatParts
  palette: number
  pose: { eyes?: "open" | "closed"; mouth?: "normal" | "open" | "smile" }
  equipment: Record<string, number>
}

export const INITIAL_STATE: BuilderState = {
  parts: DEFAULT_CAT,
  palette: DEFAULT_PALETTE,
  pose: { eyes: "open", mouth: "normal" },
  equipment: {},
}

/** What the drawer is currently browsing. `null` = closed. */
export type DrawerTarget =
  | { kind: "part"; slot: PartSlot }
  | { kind: "equip"; slot: EquipSlot }
  | { kind: "presets" }
  | { kind: "palette" }

/**
 * Part slot → the clip that draws it.
 * `clipName` (lowercase) is the SVG directory; `clipNamePascal` keys part_bounds.
 * Arms reuse the leg clip — the rig draws them from the same symbol.
 */
export const PART_CLIPS: Record<PartSlot, { clipName: string; clipNamePascal: string }> = {
  body: { clipName: "catbody", clipNamePascal: "CatBody" },
  head: { clipName: "cathead", clipNamePascal: "CatHead" },
  ears: { clipName: "catear", clipNamePascal: "CatEar" },
  eyes: { clipName: "cateye", clipNamePascal: "CatEye" },
  eyebrows: { clipName: "cateyebrow", clipNamePascal: "CatEyebrow" },
  mouth: { clipName: "catmouth", clipNamePascal: "CatMouth" },
  tail: { clipName: "cattail", clipNamePascal: "CatTail" },
  legs: { clipName: "catleg", clipNamePascal: "CatLeg" },
  arms: { clipName: "catleg", clipNamePascal: "CatLeg" },
  texture: { clipName: "cattexture", clipNamePascal: "CatTexture" },
}

// `claws` is deliberately absent: no catclaws/ directory ships, it has no entry
// in catparts_frames.json, and buildDrawList never draws it. Offering it gave an
// empty picker and a 404 on every thumbnail. The field stays on CatParts because
// story-cat records carry it.

export const PART_SLOTS: PartSlot[] = [
  "body", "head", "ears", "eyes", "eyebrows", "mouth",
  "tail", "legs", "arms", "texture",
]

export const EQUIP_SLOTS: EquipSlot[] = ["head", "face", "neck", "weapon", "trinket"]

// The rig anchors items to the head (ahead/aneck/aface). Weapons and trinkets
// have no anchor anywhere in the cat rig, so they are listed but not drawn.
export const SLOT_DRAWN_ON_CAT: Record<EquipSlot, boolean> = {
  head: true, face: true, neck: true, weapon: false, trinket: false,
}

/** The frame a slot currently shows, flattening the rig's left/right pairs. */
export function slotFrame(parts: CatParts, slot: PartSlot): number {
  const v = parts[slot]
  if (typeof v === "number") return v
  if (v && typeof v === "object") {
    const o = v as Record<string, number | undefined>
    return o.left ?? o.leg1 ?? o.arm1 ?? 1
  }
  return 1
}

/**
 * Write a slot back. Pairs stay pairs (both sides set) so a preset's shape is
 * never silently collapsed into a scalar the compositor has to re-widen.
 */
export function withSlot(parts: CatParts, slot: PartSlot, frame: number): CatParts {
  if (slot === "eyes" || slot === "ears" || slot === "eyebrows") {
    return { ...parts, [slot]: { left: frame, right: frame } }
  }
  if (slot === "legs") return { ...parts, legs: { leg1: frame, leg2: frame } }
  if (slot === "arms") return { ...parts, arms: { arm1: frame, arm2: frame } }
  return { ...parts, [slot]: frame }
}

export function serializeState(state: BuilderState): string {
  return btoa(JSON.stringify(state))
}

export function deserializeState(encoded: string): BuilderState | null {
  try {
    const parsed = JSON.parse(atob(encoded)) as BuilderState
    if (!parsed || typeof parsed !== "object" || !parsed.parts) return null
    return {
      parts: parsed.parts,
      palette: typeof parsed.palette === "number" ? parsed.palette : DEFAULT_PALETTE,
      pose: parsed.pose ?? { eyes: "open", mouth: "normal" },
      equipment: parsed.equipment ?? {},
    }
  } catch {
    return null
  }
}

/**
 * A rollable cat. Frames are picked from what the exporter actually shipped
 * (passed in by the caller, which has the frame index loaded) so randomize can
 * never land on a gap and blank a part — picking 1..250 blindly did.
 */
export function randomParts(framesByClip: Record<string, number[]>): CatParts {
  const pick = (slot: PartSlot): number | undefined => {
    const list = framesByClip[PART_CLIPS[slot].clipName]
    if (!list?.length) return undefined
    return list[Math.floor(Math.random() * list.length)]
  }
  const legs = pick("legs")
  const arms = pick("arms")
  // Paired slots roll ONCE. Rolling each side separately gave every random cat
  // mismatched ears and eyes, which reads as a bug rather than as variety.
  const ears = pick("ears") ?? 1005
  const eyes = pick("eyes") ?? 1030
  return {
    body: pick("body") ?? DEFAULT_CAT.body,
    head: pick("head") ?? DEFAULT_CAT.head,
    ears: { left: ears, right: ears },
    eyes: { left: eyes, right: eyes },
    eyebrows: pick("eyebrows") ?? DEFAULT_CAT.eyebrows,
    mouth: pick("mouth") ?? DEFAULT_CAT.mouth,
    tail: pick("tail") ?? DEFAULT_CAT.tail,
    legs: { leg1: legs ?? 1, leg2: legs ?? 1 },
    arms: { arm1: arms ?? legs ?? 1, arm2: arms ?? legs ?? 1 },
    texture: pick("texture") ?? DEFAULT_CAT.texture,
  }
}

/** palette.png rows 0-48 are what a wild cat can roll. */
export const GENETIC_PALETTES = 49

/** Equipment art frame = the trailing number of the item's icon path. */
export function itemFrame(item: { icon?: unknown }): number | null {
  const m = /(\d+)\.svg$/.exec(String(item.icon || ""))
  return m ? parseInt(m[1], 10) : null
}
