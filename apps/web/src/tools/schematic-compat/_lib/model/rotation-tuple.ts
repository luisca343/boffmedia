/**
 * Faithful port of Hytale's block-placement rotation system
 * (`Rotation` / `RotationTuple` / `VariantRotation` in the decompiled server:
 * `.../asset/type/blocktype/config/{Rotation,RotationTuple,VariantRotation}.java`).
 *
 * A placement's `rotation` field in a `.prefab.json` is a **`RotationTuple`
 * index**, not a per-block ordinal: `index = yaw + 4·pitch + 16·roll`, where each
 * of yaw/pitch/roll is a {@link Rot} (0/90/180/270°, ordinals 0–3). The block's
 * orientation matrix is `R = Ry(yaw)·Rx(pitch)·Rz(roll)` — exactly the game's
 * `RotationTuple.eulerToMatrix`.
 *
 * Which indices are *legal* for a given block depends on its
 * {@link VariantRotation} type (None/Wall/UpDown/Pipe/DoublePipe/NESW/
 * UpDownNESW/All). Each variant also defines a `verify` that folds an arbitrary
 * orientation into its legal set — the same normalisation the server applies when
 * a block is placed. {@link verifyVariant} reproduces those `verify` lambdas, so
 * a cross-game conversion can pick the correct legal index for any target block
 * instead of writing an out-of-range index and hoping the game fixes it up.
 *
 * Pure data + math: no THREE, no game types.
 */

/** A 90° rotation step. Ordinals match Hytale's `Rotation` enum (None…TwoSeventy). */
export type Rot = 0 | 1 | 2 | 3;

export interface RotationTuple {
  yaw: Rot;
  pitch: Rot;
  roll: Rot;
}

/** Every Hytale `VariantRotation` enum constant. */
export type VariantRotation =
  | "None"
  | "Wall"
  | "UpDown"
  | "Pipe"
  | "DoublePipe"
  | "NESW"
  | "UpDownNESW"
  | "All";

const VARIANT_NAMES = new Set<string>([
  "None", "Wall", "UpDown", "Pipe", "DoublePipe", "NESW", "UpDownNESW", "All",
]);

/** Narrow a raw `BlockType.VariantRotation` string to a known variant (or undefined). */
export function asVariantRotation(raw: unknown): VariantRotation | undefined {
  if (typeof raw !== "string") return undefined;
  // "Debug" in the source re-uses UpDownNESW semantics; treat it as such.
  if (raw === "Debug") return "UpDownNESW";
  return VARIANT_NAMES.has(raw) ? (raw as VariantRotation) : undefined;
}

// ─── index ⇄ (yaw, pitch, roll) ────────────────────────────────────────────────

/** `RotationTuple.index(yaw, pitch, roll)` — base-4 pack (yaw low, roll high). */
export function rotationIndex(yaw: Rot, pitch: Rot, roll: Rot = 0): number {
  return roll * 16 + pitch * 4 + yaw;
}

/** Inverse of {@link rotationIndex}; wraps into the valid 0–63 range. */
export function decodeRotationIndex(index: number): RotationTuple {
  const i = ((Math.trunc(index) % 64) + 64) % 64;
  return {
    yaw: (i % 4) as Rot,
    pitch: (Math.floor(i / 4) % 4) as Rot,
    roll: (Math.floor(i / 16) % 4) as Rot,
  };
}

// ─── legal index sets per variant ──────────────────────────────────────────────

const i = rotationIndex;

/**
 * The legal `rotation` indices for each variant — the implicit `NONE` (index 0)
 * plus the variant's `getRotations()` list from `VariantRotation.java`. Used as
 * the block's `validStates.rotation` so `transformStates` keeps a bridged value
 * and drops nonsense ones. `All` is left permissive (all 24 physical
 * orientations collapse onto a subset of 0–63; enumerating the canonical few
 * isn't worth it for the one block that uses it).
 */
export const VARIANT_LEGAL_INDICES: Record<VariantRotation, number[]> = {
  None: [0],
  Wall: [0, i(1, 0)], // {0, 1}
  UpDown: [0, i(0, 2)], // {0, 8}
  Pipe: [0, i(0, 1), i(1, 1)], // {0, 4, 5}
  DoublePipe: [0, i(0, 1), i(1, 1), i(2, 1), i(3, 1), i(0, 2)], // {0,4,5,6,7,8}
  NESW: [0, 1, 2, 3],
  UpDownNESW: [0, 1, 2, 3, i(0, 2), i(1, 2), i(2, 2), i(3, 2)], // {0..3, 8..11}
  All: Array.from({ length: 64 }, (_, k) => k),
};

// ─── verify() — fold an arbitrary orientation into a variant's legal set ─────────

/** `VariantRotation.validatePipe`: normalise a Pipe axis component to {None, Ninety}. */
function validatePipe(r: Rot): Rot {
  switch (r) {
    case 0: return 0;
    case 1: return 1;
    case 2: return 0; // OneEighty → None
    case 3: return 1; // TwoSeventy → Ninety
  }
}

/** `Rotation.flip()` = +180°. */
function flip(r: Rot): Rot {
  return ((r + 2) % 4) as Rot;
}

/**
 * Port of each `VariantRotation` constant's `verify` lambda: given any
 * orientation, return the legal `RotationTuple` index that variant would settle
 * on. This is the game's own placement normalisation, so a bridged MC→Hytale
 * rotation is guaranteed valid (and correct) for the target block.
 */
export function verifyVariant(variant: VariantRotation | undefined, rawIndex: number): number {
  const { yaw, pitch } = decodeRotationIndex(rawIndex);
  switch (variant) {
    case undefined:
    case "None":
      return 0;
    case "Wall":
      // yaw Ninety/TwoSeventy → the E–W wall orientation (index 1), else N–S (0).
      return yaw === 1 || yaw === 3 ? i(1, 0) : 0;
    case "UpDown":
      return pitch === 2 ? i(0, 2) : 0;
    case "Pipe":
      if (pitch === 1 || pitch === 3) return i(validatePipe(yaw), validatePipe(pitch));
      return i(0, validatePipe(pitch));
    case "DoublePipe":
      switch (pitch) {
        case 3: return i(flip(yaw), 1);
        case 1: return i(yaw, 1);
        case 2: return i(0, 2);
        default: return 0;
      }
    case "NESW":
      return i(yaw, 0);
    case "UpDownNESW":
      return pitch === 2 ? i(yaw, 2) : i(yaw, 0);
    case "All":
      return rawIndex;
  }
}

// ─── orientation quaternion (for the renderer) ─────────────────────────────────

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

const QUAT_IDENTITY: Quat = { x: 0, y: 0, z: 0, w: 1 };

/** Quaternion for `deg`° about a principal axis. */
function axisQuat(axis: "x" | "y" | "z", deg: number): Quat {
  const h = (deg * Math.PI) / 360;
  const s = Math.sin(h);
  return { x: axis === "x" ? s : 0, y: axis === "y" ? s : 0, z: axis === "z" ? s : 0, w: Math.cos(h) };
}

/** Hamilton product a·b. */
function qmul(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

/**
 * The whole-block placement quaternion for a `rotation` index, matching the
 * game's `R = Ry(yaw)·Rx(pitch)·Rz(roll)`. Covers all 64 `RotationTuple`
 * indices (every variant, including `Pipe`/`DoublePipe` side tilts, `UpDown`
 * flips, and `All`'s roll), not just the upright/on-side/upside-down subset.
 */
export function orientationQuat(index: number): Quat {
  const { yaw, pitch, roll } = decodeRotationIndex(index);
  if (yaw === 0 && pitch === 0 && roll === 0) return QUAT_IDENTITY;
  return qmul(qmul(axisQuat("y", yaw * 90), axisQuat("x", pitch * 90)), axisQuat("z", roll * 90));
}
