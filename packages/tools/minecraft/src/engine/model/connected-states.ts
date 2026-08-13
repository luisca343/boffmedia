/**
 * Neighbour-derived block states for modded blocks whose shape is not in their
 * metadata.
 *
 * A schematic stores a block id and 4 bits of metadata — nothing else. Most
 * modded blocks are fine with that, but a *connected* block computes part of its
 * state from its surroundings at render time (Minecraft's `getActualState`), so
 * that part is simply absent from the file. Fureniku's Roads is the clearest
 * case: a painted lane declares its arms under `north`/`east`/`south`/`west`, and
 * a barrier picks its post orientation from which sides it connects to. With
 * those properties missing, the resolver drew only the base model — a lane with
 * no line on it, and a barrier stuck in whichever orientation its item model
 * happened to use.
 *
 * The rules below are transcribed from the mod's own `getActualState` bytecode,
 * not guessed, because "close" reads as wrong: a road line pointing the wrong way
 * is more obviously broken than no line at all.
 *
 * Scope is deliberately narrow. Only `BarrierBlock` and `LinePaintBlock` use the
 * four-boolean + `zz_default_stuff` idiom (verified by scanning every class in
 * the jar for that property name), so those are the only families here. Roads has
 * ~16 further classes that derive state through *different* enum properties;
 * they still render their base shape and are no worse than before.
 */

/** A block id at a position, or null for air / outside the volume. */
export type BlockAt = (x: number, y: number, z: number) => string | null;

const NORTH = [0, 0, -1] as const;
const SOUTH = [0, 0, 1] as const;
const WEST = [-1, 0, 0] as const;
const EAST = [1, 0, 0] as const;

/**
 * `LinePaintBlock` + `ArrowLinePaintBlock` — the exact set `canConnectTo` tests.
 *
 * Enumerated rather than matched on the `line_` prefix on purpose: `line_*_middle`,
 * `line_*_side`, `line_*_far_side` and `line_*_crossing_*` are different classes
 * that do *not* satisfy the check despite the shared prefix.
 */
const LINE_CONNECTABLE = new Set(
  [
    ...["white", "yellow", "red"].flatMap((c) =>
      ["full", "thick", "double", "double_thick"].map((t) => `line_${c}_straight_${t}`),
    ),
    ...["white", "yellow", "red"].map((c) => `${c}_arrow_line`),
  ].map((n) => `furenikusroads:${n}`),
);

/** The two blocks whose class is `BarrierBlock`, i.e. the ones with a `post`. */
const BARRIER_BLOCKS = new Set([
  "furenikusroads:barrier_standard_mid",
  "furenikusroads:barrier_tall_mid",
]);

/** Every `IConnectable` implementer — what a barrier may connect to vertically. */
const BARRIER_CONNECTABLE = new Set(
  [
    "barrier_standard_mid",
    "barrier_tall_mid",
    "barrier_bars_mid",
    "barrier_bars_mid_2",
    "barrier_bars_mid_3",
    "barrier_bars_mid_concrete_1",
    "barrier_bars_mid_concrete_2",
    "barrier_wall_mid_concrete_1",
    "barrier_wall_mid_concrete_2",
    "barrier_wall_pole_mid_concrete_1",
    "barrier_wall_pole_mid_concrete_2",
    "barrier_low_mid",
    "barrier_concrete_1_mid",
    "barrier_concrete_2_mid",
    "barrier_end",
    // Registered "kerb" even though the class is CurbBlock.
    "kerb_standard",
  ].map((n) => `furenikusroads:${n}`),
);

/**
 * Vanilla blocks that are present but are not full opaque cubes, so a barrier
 * does not treat them as a wall to connect into.
 *
 * `isOpaqueCube` is a property of the block's Java, and a schematic carries no
 * such information — this list is the honest approximation. It covers the
 * non-cube shapes that actually occur next to roadside barriers; an unlisted
 * exotic block counts as solid, which at worst adds a connector nub on one side.
 */
const NOT_SOLID = /(_slab|_stairs|_fence|_fence_gate|_wall|_pane|_carpet|_button|_pressure_plate|_torch|_sign|_rail|_door|_trapdoor|_bars|_layer|_bed|_chest|_pot|_head|_banner|_sapling|_leaves|glass|water|lava|air|ladder|vine|snow|web|lever|redstone_wire|tripwire|flower|mushroom|grass|fern|reeds|carrot|potato|wheat|beetroot|cactus|cake|anvil|hopper|piston|slime|cauldron|brewing|enchanting|daylight|end_rod|chain|lantern|candle|scaffolding)/;

function isSolidCube(blockId: string | null): boolean {
  if (!blockId) return false;
  return !NOT_SOLID.test(blockId);
}

/** Metadata as an integer; modded legacy blocks carry it verbatim as `states.meta`. */
function metaOf(states: Record<string, string>): number {
  const raw = parseInt(states.meta ?? "", 10);
  return Number.isFinite(raw) ? raw : 0;
}

/**
 * Whether this block's rendered shape depends on its neighbours. Cheap enough to
 * call per block group.
 */
export function hasConnectedStates(blockId: string): boolean {
  return LINE_CONNECTABLE.has(blockId) || BARRIER_BLOCKS.has(blockId);
}

/**
 * The states a connected block would have in world, merged over the ones the
 * schematic supplied. Returns the input untouched for any block without a rule.
 */
export function deriveConnectedStates(
  blockId: string,
  states: Record<string, string>,
  x: number,
  y: number,
  z: number,
  at: BlockAt,
): Record<string, string> {
  if (LINE_CONNECTABLE.has(blockId)) return lineStates(states, x, y, z, at);
  if (BARRIER_BLOCKS.has(blockId)) return barrierStates(states, x, y, z, at);
  return states;
}

/**
 * `LinePaintBlock.getActualState`. A side connects when a line block sits beside
 * it at the same height *or one step up or down* — that is how a painted line
 * follows a road over a slope.
 *
 * `facing` comes from metadata, not neighbours: 0 → `north_south`, 1 →
 * `east_west`, anything else → `connect`. It is applied unconditionally, so a
 * `north_south` lane with a line to the east really does render a T in game.
 */
function lineStates(
  states: Record<string, string>,
  x: number,
  y: number,
  z: number,
  at: BlockAt,
): Record<string, string> {
  const linked = ([dx, , dz]: readonly [number, number, number]) =>
    LINE_CONNECTABLE.has(at(x + dx, y, z + dz) ?? "") ||
    LINE_CONNECTABLE.has(at(x + dx, y - 1, z + dz) ?? "") ||
    LINE_CONNECTABLE.has(at(x + dx, y + 1, z + dz) ?? "");

  const meta = metaOf(states);
  return {
    ...states,
    north: String(linked(NORTH)),
    south: String(linked(SOUTH)),
    east: String(linked(EAST)),
    west: String(linked(WEST)),
    facing: meta === 0 ? "north_south" : meta === 1 ? "east_west" : "connect",
    // Never written by the mod; it exists only to hang always-applied submodels
    // on, and is `true` in every state the block can be in.
    zz_default_stuff: "true",
  };
}

/**
 * `BarrierBlock.getActualState` + `postDirection`.
 *
 * The two connection tests differ, which matters: at the same height a barrier
 * connects to any `IConnectable` *or any solid cube* (so a barrier run butts into
 * a wall), while one step up or down it connects only to another `IConnectable`.
 */
function barrierStates(
  states: Record<string, string>,
  x: number,
  y: number,
  z: number,
  at: BlockAt,
): Record<string, string> {
  const linked = ([dx, , dz]: readonly [number, number, number]) => {
    const side = at(x + dx, y, z + dz);
    if (BARRIER_CONNECTABLE.has(side ?? "") || isSolidCube(side)) return true;
    return (
      BARRIER_CONNECTABLE.has(at(x + dx, y - 1, z + dz) ?? "") ||
      BARRIER_CONNECTABLE.has(at(x + dx, y + 1, z + dz) ?? "")
    );
  };

  const north = linked(NORTH);
  const south = linked(SOUTH);
  const east = linked(EAST);
  const west = linked(WEST);

  return {
    ...states,
    north: String(north),
    south: String(south),
    east: String(east),
    west: String(west),
    post: postDirection(metaOf(states), north, east, south, west),
    zz_default_stuff: "true",
  };
}

/**
 * Only metadata bit 0 is stored, and it means "this barrier has a post at all" —
 * the orientation is re-derived here.
 *
 * The naming is counter-intuitive and is transcribed literally: connecting east
 * and west selects `north_south`, which is the post model that spans an east-west
 * run. A barrier connected on all four sides has no post.
 */
function postDirection(
  meta: number,
  north: boolean,
  east: boolean,
  south: boolean,
  west: boolean,
): "north_south" | "east_west" | "none" {
  if ((meta & 1) !== 1) return "none";
  if (north && east && south && west) return "none";
  return east && west ? "north_south" : "east_west";
}
