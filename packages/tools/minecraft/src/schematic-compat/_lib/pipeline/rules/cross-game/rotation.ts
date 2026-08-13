import type { UnifiedBlock, BlockDefinition } from "../../../../../engine/types";
import type { GameId } from "../../../../../engine/adapters/game-adapter";
import {
  rotationIndex,
  decodeRotationIndex,
  verifyVariant,
  type Rot,
} from "../../../../../engine/model/rotation-tuple";

/**
 * Bridges Minecraft orientation blockstates (`facing`/`half`/`type`/`axis`) and
 * Hytale's placement `rotation` index across a cross-game conversion.
 *
 * Hytale's index is a `RotationTuple` — `yaw + 4·pitch + 16·roll`, each a 90°
 * step — with orientation `Ry(yaw)·Rx(pitch)·Rz(roll)` (see
 * `_lib/model/rotation-tuple.ts`, a direct port of the server's `RotationTuple`).
 * `yaw` faces (per `Rotation.java`'s `axisDirection`): None→-Z, Ninety→-X,
 * OneEighty→+Z, TwoSeventy→+X — which lines up with Minecraft's world
 * north=-Z / west=-X / south=+Z / east=+X in exactly this order (not compass
 * order): yaw 0/1/2/3 = north/west/south/east.
 *
 * Crucially, which indices are *legal* depends on the target block's
 * {@link BlockDefinition.variantRotation} type (a log is a `Pipe`, a window a
 * `Wall`, a stair an `UpDownNESW`, …). We compute a full-space "raw" orientation
 * from the Minecraft states, then fold it into the target block's legal set with
 * the same `verify()` the server runs on placement — so a converted block gets a
 * rotation it actually accepts (a horizontal log stays horizontal; a window
 * picks its N–S vs E–W wall) instead of an out-of-range index.
 */
const YAW_BY_FACING: Record<string, number> = { north: 0, west: 1, south: 2, east: 3 };
const FACING_BY_YAW = ["north", "west", "south", "east"] as const;

/**
 * Trapdoor `facing` → yaw. A Minecraft trapdoor's `facing` is mirrored on the
 * N–S axis relative to the general {@link YAW_BY_FACING} convention (confirmed
 * in-game: E–W land correctly, N–S on the opposite side), so north/south are
 * swapped here (east/west unchanged). The Hytale trapdoor hinges on its -Z
 * (north) edge at yaw 0 — `Trapdoor.blockymodel`'s pivots sit at z≈-14.
 */
const TRAPDOOR_YAW_BY_FACING: Record<string, number> = { north: 2, west: 1, south: 0, east: 3 };

/** A pane/bars/fence/wall connection value that counts as "connected". */
function isConnected(v: string | undefined): boolean {
  return v !== undefined && v !== "false" && v !== "none";
}

/** Minecraft's four horizontal connection states (also present on walls as `none`/`low`/`tall`). */
const CONNECTION_KEYS = ["north", "south", "east", "west"] as const;

/** The connected faces of a pane/bars/fence/wall, or `undefined` if it has no connection states. */
interface Connections {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
  count: number;
}
function readConnections(states: Record<string, string>): Connections | undefined {
  if (!CONNECTION_KEYS.some((k) => k in states)) return undefined;
  const n = isConnected(states.north);
  const s = isConnected(states.south);
  const e = isConnected(states.east);
  const w = isConnected(states.west);
  return { n, s, e, w, count: (n ? 1 : 0) + (s ? 1 : 0) + (e ? 1 : 0) + (w ? 1 : 0) };
}

/** A `WallConnectedBlockTemplate` shape name (its key on a block's `connections`). */
type ConnectionShape = "straight" | "corner" | "t" | "cross";

/**
 * A Minecraft connection pattern → the Hytale connected-block shape + yaw that
 * reproduces it. Derived from `WallConnectedBlockTemplate` and confirmed against
 * the real fence/bar `.blockymodel` geometry: at yaw 0 a `Straight` connects
 * E–W, a `Corner` connects W+S, a `T` connects E+W+S (missing N), a `Cross`
 * connects all four. A yaw step rotates connected faces N→W→S→E (`Ry(90)`, per
 * `rotation-tuple.ts`), so the returned yaw is the index whose rotation carries
 * the shape's base faces onto the block's actual connected faces.
 *
 * A single connection (or none) has no dedicated Hytale shape, so it reads as a
 * `Straight` segment along that face's axis — matching how such a fence looks
 * in-game (and how Minecraft renders a lone/one-sided post).
 */
function connectionShape(c: Connections): { shape: ConnectionShape; yaw: Rot } {
  switch (c.count) {
    case 4:
      return { shape: "cross", yaw: 0 };
    case 3:
      // T base is missing North at yaw 0; the missing face rotates N→W→S→E.
      return { shape: "t", yaw: (!c.n ? 0 : !c.w ? 1 : !c.s ? 2 : 3) as Rot };
    case 2:
      if (c.n && c.s) return { shape: "straight", yaw: 1 }; // N–S
      if (c.e && c.w) return { shape: "straight", yaw: 0 }; // E–W
      // Corner base connects {W,S} at yaw 0: {W,S}=0, {S,E}=1, {E,N}=2, {N,W}=3.
      return { shape: "corner", yaw: (c.w && c.s ? 0 : c.s && c.e ? 1 : c.e && c.n ? 2 : 3) as Rot };
    default:
      // 0 or 1 connections → a straight segment (yaw 1 along N–S, else E–W).
      return { shape: "straight", yaw: (c.n || c.s ? 1 : 0) as Rot };
  }
}

/**
 * A Minecraft block's orientation states → a full-space Hytale `RotationTuple`
 * index (before any per-variant clamping). Handles the MC orientation families
 * that aren't connection-based: `axis` (logs/pillars), horizontal + vertical
 * `facing` (stairs/doors/droppers), and the `half`/`type` vertical flip.
 * Connection blocks (panes/bars/fences/walls) are handled separately by
 * {@link connectionShape}, which resolves both a shape variant and a yaw.
 */
function mcStatesToRawRotation(states: Record<string, string>): number {
  // Axis pillars: index 0 = upright (Y), 4 = along Z, 5 = along X — the same
  // orientations Hytale's `Pipe` variant uses, so a Pipe target keeps them and
  // any other target folds them via verify().
  switch (states.axis) {
    case "x": return rotationIndex(1, 1); // 5
    case "z": return rotationIndex(0, 1); // 4
    case "y": return 0;
  }

  const facing = states.facing;
  let yaw: Rot = 0;
  let pitch: Rot = 0;
  if (facing === "up") pitch = 3; // faces +Y
  else if (facing === "down") pitch = 1; // faces -Y
  else yaw = (YAW_BY_FACING[facing ?? ""] ?? 0) as Rot;

  // Vertical flip: MC stair `half=top` / slab `type=top` → 180° about X.
  if (states.half === "top" || states.type === "top") pitch = ((pitch + 2) % 4) as Rot;

  return rotationIndex(yaw, pitch);
}

/**
 * A Hytale `rotation` index → Minecraft orientation states. Emits every state a
 * plausible MC target might declare (`facing`, `half`, `axis`); `transformStates`
 * keeps only the ones valid for the actual target block and drops the rest.
 */
function hytaleRotationToMcStates(rotation: number): Record<string, string> {
  const { yaw, pitch } = decodeRotationIndex(rotation);
  const out: Record<string, string> = {
    facing: FACING_BY_YAW[yaw],
    half: pitch === 2 ? "top" : "bottom",
  };
  // A tilted pillar (pitch ±90) is an axis block: yaw None/OneEighty → Z, else X.
  if (pitch === 1 || pitch === 3) out.axis = yaw % 2 === 0 ? "z" : "x";
  else out.axis = "y";
  return out;
}

/**
 * Minecraft stair `shape` <-> Hytale stair `state` (its `Corner_*`/`Inverted_Corner_*`
 * `State.Definitions` label). Derived by compiling the real
 * `Stairs_Corner_*`/`Stairs_Inverted_Corner_*` `.blockymodel` geometry (from the
 * bundled `HytaleAssets`): `Corner_*` keeps only a quarter-cell step (the same
 * reduced geometry as MC's `outer_*`, a wedge with material cut away), while
 * `Inverted_Corner_*` fills a three-quarter step (MC's `inner_*`, the filled-in
 * concave corner) — so `Corner_*` <-> `outer_*` and `Inverted_Corner_*` <->
 * `inner_*`. Left/right matches directly: at yaw 0 (facing north) the `_Left`
 * variants' extra/missing quarter sits on the west side both in the compiled
 * Hytale geometry and in MC's "left relative to facing" convention. `straight`
 * has no label at all (the base model with no `state` suffix).
 */
const HYTALE_STAIR_STATE_BY_MC_SHAPE: Record<string, string> = {
  outer_left: "Corner_Left",
  outer_right: "Corner_Right",
  inner_left: "Inverted_Corner_Left",
  inner_right: "Inverted_Corner_Right",
};
const MC_SHAPE_BY_HYTALE_STAIR_STATE: Record<string, string> = {
  Corner_Left: "outer_left",
  Corner_Right: "outer_right",
  Inverted_Corner_Left: "inner_left",
  Inverted_Corner_Right: "inner_right",
};

/**
 * Minecraft trapdoor `open` <-> Hytale trapdoor `state`. Every Hytale trapdoor
 * (`Furniture_*_Trapdoor`) declares exactly `CloseDoorOut` / `OpenDoorOut` as its
 * `State.Definitions` and only a `NESW` `VariantRotation` (no upside-down/on-side
 * group) — the open (vertical, against-the-wall) look comes entirely from the
 * `state`-selected animation pose, not from `rotation`. Doors (`hinge` present)
 * are deliberately excluded: their open/closed state also depends on which way
 * they swing (`CloseDoorIn`/`CloseDoorOut`/`OpenDoorIn`/`OpenDoorOut`), which
 * `hinge` alone doesn't disambiguate — left as a follow-up.
 */
function isTrapdoorLike(states: Record<string, string>): boolean {
  return "open" in states && "half" in states && !("hinge" in states);
}

const MC_ORIENTATION_KEYS = ["facing", "half", "type", "axis", "north", "south", "east", "west"];

/**
 * Carries orientation across a cross-game conversion by translating it into
 * the target game's own placement vocabulary before `transformStates` copies
 * same-named keys across. No-op when source and target are the same game (the
 * normal same-game state logic already handles that case).
 *
 * `targetDef` (the resolved target block) supplies its `variantRotation` so an
 * MC→Hytale conversion can clamp to the block's legal set, and its `connections`
 * so a converted fence/bars/wall bakes the right shape variant. It's optional:
 * the 3D preview calls without it (target block defs live in the worker), in
 * which case the raw orientation passes through un-clamped and connection blocks
 * only get their yaw — close enough to preview, while the worker's export path
 * always passes `targetDef` and gets the exact variant + index.
 *
 * The returned block's `id` may differ from `source.id` when a connection shape
 * re-targets to a distinct block (e.g. iron bars' corner is its own block); the
 * caller must resolve that id's `BlockDefinition` before {@link transformStates},
 * which keys its result off the target def and ignores the incoming id.
 */
export function bridgeRotationStates(
  source: UnifiedBlock,
  targetGameId: GameId,
  targetDef?: BlockDefinition,
): UnifiedBlock {
  const sourceIsHytale = source.namespace === "hytale";
  const targetIsHytale = targetGameId === "hytale";
  if (sourceIsHytale === targetIsHytale) return source;

  const states = { ...source.states };
  let changed = false;
  // A connected block may re-target to a shape-specific variant block (iron bars
  // model their corner as a separate block); the caller resolves this id's def.
  let retargetId: string | undefined;

  if (targetIsHytale) {
    const conn = readConnections(source.states);
    if (conn) {
      // Pane/bars/fence/wall: bake the resolved shape variant (block id + state)
      // and yaw, because Hytale only recomputes connections on live placement —
      // a bulk prefab paste leaves them at the default, unconnected shape.
      const { shape, yaw } = connectionShape(conn);
      const variant = targetDef?.connections?.[shape] ?? targetDef?.connections?.straight;
      if (variant && targetDef && variant.id !== targetDef.id) {
        retargetId = variant.id;
        changed = true;
      }
      if (variant?.state) {
        states.state = variant.state;
        changed = true;
      }
      // A real connected target stores any of the four cardinal yaws regardless of
      // its VariantRotation, so bake the exact yaw. A plain window/wall (no shape
      // map) or the preview (no def) still folds the yaw into the legal set.
      const rawRot = rotationIndex(yaw, 0);
      const rotation =
        targetDef?.connections !== undefined
          ? rawRot
          : targetDef
          ? verifyVariant(targetDef.variantRotation, rawRot)
          : rawRot;
      if (rotation !== 0) {
        states.rotation = String(rotation);
        changed = true;
      }
    } else if (MC_ORIENTATION_KEYS.some((k) => k in source.states)) {
      const raw = mcStatesToRawRotation(source.states);
      // With a known target block, fold into its legal set exactly as the server
      // would; without one (preview), pass the raw orientation through.
      const rotation = targetDef ? verifyVariant(targetDef.variantRotation, raw) : raw;
      if (rotation !== 0) {
        states.rotation = String(rotation);
        changed = true;
      }
    }
    const cornerState = HYTALE_STAIR_STATE_BY_MC_SHAPE[source.states.shape ?? ""];
    if (cornerState) {
      states.state = cornerState;
      changed = true;
    } else if (isTrapdoorLike(source.states)) {
      states.state = source.states.open === "true" ? "OpenDoorOut" : "CloseDoorOut";
      changed = true;
      // Override the general facing→yaw with the trapdoor's N–S-mirrored mapping.
      const yaw = TRAPDOOR_YAW_BY_FACING[source.states.facing ?? ""];
      if (yaw !== undefined) {
        const raw = rotationIndex(yaw as Rot, 0);
        const rot = targetDef ? verifyVariant(targetDef.variantRotation, raw) : raw;
        if (rot !== 0) states.rotation = String(rot);
        else delete states.rotation;
      }
    }
  } else {
    const raw = source.states.rotation;
    if (raw !== undefined) {
      Object.assign(states, hytaleRotationToMcStates(parseInt(raw, 10) || 0));
      changed = true;
    }
    const shape = MC_SHAPE_BY_HYTALE_STAIR_STATE[source.states.state ?? ""];
    if (shape) {
      states.shape = shape;
      changed = true;
    } else if (source.states.state === "OpenDoorOut" || source.states.state === "CloseDoorOut") {
      states.open = source.states.state === "OpenDoorOut" ? "true" : "false";
      changed = true;
    }
  }

  if (!changed) return source;
  // When a connection shape re-targets to a different Hytale block, carry the new
  // id/name so the caller can resolve that block's def before transformStates
  // (which keys the result off the target def, ignoring the source id).
  if (retargetId) {
    return {
      ...source,
      id: retargetId,
      namespace: "hytale",
      name: retargetId.startsWith("hytale:") ? retargetId.slice("hytale:".length) : retargetId,
      states,
    };
  }
  return { ...source, states };
}

/**
 * `true` when `source` is the upper half of a two-block Minecraft door
 * (`half=upper` + `hinge`, the vanilla door blockstate signature) converting to
 * Hytale. A Hytale door is a single placement whose `.blockymodel` already
 * spans both cells (measured ~64 model units tall, i.e. two 32-unit cells) —
 * writing a second door block into the cell above produces two overlapping
 * doors in-game. The caller should substitute Hytale air for this cell instead
 * of resolving it to a block.
 */
export function isRedundantDoorHalf(source: UnifiedBlock, targetGameId: GameId): boolean {
  return (
    targetGameId === "hytale" &&
    source.namespace !== "hytale" &&
    source.states.half === "upper" &&
    "hinge" in source.states
  );
}
