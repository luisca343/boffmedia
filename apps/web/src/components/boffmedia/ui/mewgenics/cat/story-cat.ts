import type { CatParts } from "./types"

// Story cats ARE cat-builder cats: custom_cats.gon gives every one of the 210
// a full part/palette line, the same fields the builder edits. This mapping is
// the single place that translates one into the compositor's shape — the
// builder's preset loader and the codex's story-cat fiche both read it, so a
// preset can never drift from what the fiche renders.

export const MEW_DEFAULT_CAT_PARTS: CatParts = {
  body: 1000,
  head: 1000,
  ears: 1005,
  eyes: { left: 1030, right: 1030 },
  eyebrows: 1022,
  mouth: 1023,
  tail: 1007,
  legs: { leg1: 1, leg2: 1 },
  texture: 1031,
  claws: 1,
}

/** palette.png rows 0-48 are the 49 rollable cat palettes; 0 is the default. */
export const MEW_DEFAULT_PALETTE = 0

const num = (v: unknown): number | undefined => (typeof v === "number" && v > 0 ? v : undefined)

const pair = (l: unknown, r: unknown): number | { left: number; right: number } | undefined => {
  const left = num(l)
  const right = num(r)
  if (left === undefined && right === undefined) return undefined
  return { left: left ?? right ?? 1, right: right ?? left ?? 1 }
}

/** A story-cat record → the compositor's `parts` + `palette`. */
export function mewStoryCatAppearance(rec: Record<string, unknown>): { parts: CatParts; palette: number } {
  return {
    parts: {
      body: num(rec.body) ?? MEW_DEFAULT_CAT_PARTS.body,
      head: num(rec.head) ?? MEW_DEFAULT_CAT_PARTS.head,
      ears: pair(rec.leftear, rec.rightear) ?? MEW_DEFAULT_CAT_PARTS.ears,
      eyes: pair(rec.lefteye, rec.righteye) ?? MEW_DEFAULT_CAT_PARTS.eyes,
      eyebrows: pair(rec.lefteyebrow, rec.righteyebrow) ?? MEW_DEFAULT_CAT_PARTS.eyebrows,
      mouth: num(rec.mouth) ?? MEW_DEFAULT_CAT_PARTS.mouth,
      tail: num(rec.tail) ?? MEW_DEFAULT_CAT_PARTS.tail,
      legs: { leg1: num(rec.leg1) ?? 1, leg2: num(rec.leg2) ?? num(rec.leg1) ?? 1 },
      arms: {
        arm1: num(rec.arm1) ?? num(rec.leg1) ?? 1,
        arm2: num(rec.arm2) ?? num(rec.arm1) ?? num(rec.leg1) ?? 1,
      },
      texture: num(rec.texture) ?? MEW_DEFAULT_CAT_PARTS.texture,
      claws: num(rec.claws) ?? MEW_DEFAULT_CAT_PARTS.claws,
    },
    palette: typeof rec.palette === "number" ? rec.palette : MEW_DEFAULT_PALETTE,
  }
}
