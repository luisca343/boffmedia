import type { UnifiedBlock } from "../../../types";
import type { GameId } from "../../../adapters/game-adapter";

/**
 * Bridges Minecraft `facing`/`half` blockstates and Hytale's placement
 * `rotation` index (0–11) across a cross-game conversion.
 *
 * Hytale's index is `group * 4 + yaw` (see `blockRotationQuat` in
 * `_lib/model/blockymodel.ts`): `yaw` is a 90°-per-step compass spin, `group`
 * is upright(0) / on-side(1) / upside-down(2). Cross-referenced against the
 * real Hytale server source (`Rotation.java`'s `axisDirection`): yaw=None
 * faces -Z, yaw=Ninety faces -X, yaw=OneEighty faces +Z, yaw=TwoSeventy faces
 * +X. Minecraft's world convention is north=-Z, west=-X, south=+Z, east=+X —
 * so the two align directly, just not in compass (clockwise) order:
 * yaw 0/1/2/3 = north/west/south/east.
 */
const YAW_BY_FACING: Record<string, number> = { north: 0, west: 1, south: 2, east: 3 };
const FACING_BY_YAW = ["north", "west", "south", "east"] as const;

/** Minecraft `facing`/`half` states → a Hytale placement `rotation` index. */
export function mcStatesToHytaleRotation(states: Record<string, string>): number {
  const yaw = YAW_BY_FACING[states.facing] ?? 0;
  const group = states.half === "top" ? 2 : 0;
  return group * 4 + yaw;
}

/** A Hytale placement `rotation` index → Minecraft `facing`/`half` states. */
export function hytaleRotationToMcStates(rotation: number): { facing: string; half: string } {
  const r = ((Math.trunc(rotation) % 12) + 12) % 12;
  const yaw = r % 4;
  const group = Math.floor(r / 4);
  return { facing: FACING_BY_YAW[yaw], half: group === 2 ? "top" : "bottom" };
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

/**
 * Carries orientation across a cross-game conversion by translating it into
 * the target game's own placement vocabulary before `transformStates` copies
 * same-named keys across. No-op when source and target are the same game (the
 * normal same-game state logic already handles that case).
 */
export function bridgeRotationStates(source: UnifiedBlock, targetGameId: GameId): UnifiedBlock {
  const sourceIsHytale = source.namespace === "hytale";
  const targetIsHytale = targetGameId === "hytale";
  if (sourceIsHytale === targetIsHytale) return source;

  const states = { ...source.states };
  let changed = false;

  if (targetIsHytale) {
    if ("facing" in source.states || "half" in source.states) {
      const rotation = mcStatesToHytaleRotation(source.states);
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
    }
  } else {
    const raw = source.states.rotation;
    if (raw !== undefined) {
      const { facing, half } = hytaleRotationToMcStates(parseInt(raw, 10) || 0);
      states.facing = facing;
      states.half = half;
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

  return changed ? { ...source, states } : source;
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
