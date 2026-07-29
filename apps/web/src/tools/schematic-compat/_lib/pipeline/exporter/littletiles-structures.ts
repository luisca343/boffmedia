/**
 * 1.12 → 1.21 LittleTiles structure-compound converter, mirroring the modern
 * mod's own OldLittleTilesDataParser.convertStructureData — a compound rewritten
 * the same way the mod rewrites it is load-compatible by definition.
 *
 * Wire conventions (verified against a real 1.21.1 in-game save):
 * - Booleans are written as 1 only when true and omitted otherwise (the modern
 *   save convention), except rotation's `c`, whose PRESENCE — not value —
 *   selects the clockwise variant against the `d` (fixed degree) variant.
 * - Doors always carry the two-state machine (`s`: closed/opened) the modern
 *   loader requires, `aS: -1`, no `cS`, and an EMPTY transition list `t` (the
 *   ground-truth in-game axis door saves `t` empty and works). 1.12 `events`
 *   timelines are dropped with a warning; `opened` is dropped like the mod
 *   does — a door saved open converts to its closed state.
 * - IntArray fields (`b`, `center`, …) pass through as Int32Array so they
 *   serialize as IntArrays; plain numbers are fine everywhere else because the
 *   modern mod loads these fields with numeric leniency.
 */
import {
  LT_STRUCTURE_ID_MAP,
  LT_STRUCTURE_UNSUPPORTED,
} from "@/lib/schematic/loader/littletiles-support";

export interface LtStructureContext {
  /**
   * Resolve a 1.12 `"mod:block[:meta]"` reference to a modern blockstate
   * string, or null when it is unresolvable / lands on air (key dropped).
   */
  resolveBlockRef(ref: string): string | null;
  /** Report a lossy conversion detail; the caller prefixes type + position. */
  warn(detail: string): void;
}

const isCompound = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !ArrayBuffer.isView(v);

/** NBT booleans arrive from the parser as numbers (Byte 0/1). */
const truthy = (v: unknown): boolean => v === true || (typeof v === "number" && v !== 0);

const intOf = (v: unknown): number => (typeof v === "number" ? v : 0);

/**
 * A 1.12 compound that links into a structure tree (`parent` connection or a
 * non-empty `children` list). Passing half-converted trees through risks
 * corrupted links on load, so the caller flattens these instances instead.
 */
export function hasNestedStructureLinks(raw: Record<string, unknown>): boolean {
  if (raw.parent !== undefined) return true;
  return Array.isArray(raw.children) && raw.children.length > 0;
}

/** Base rewrite every type gets: name→n, blocks→b, signal→ex, all verbatim. */
function convertBase(raw: Record<string, unknown>, out: Record<string, unknown>): void {
  if (typeof raw.name === "string") out.n = raw.name;
  if (raw.blocks instanceof Int32Array) out.b = raw.blocks;
  if (Array.isArray(raw.signal)) out.ex = raw.signal;
}

/** Door-common fields (contract C.1, OldLittleTilesDataParser.convertDoorBaseData). */
function convertDoorCommon(
  raw: Record<string, unknown>,
  out: Record<string, unknown>,
  ctx: LtStructureContext,
): void {
  if (isCompound(raw.state)) out.state = raw.state;
  if (truthy(raw.activateParent)) out.actP = 1;
  if (!truthy(raw.disableRightClick)) out.hand = 1;
  if (truthy(raw.stayAnimated)) out.stay = 1;
  if (raw.sounds === undefined ? true : truthy(raw.sounds)) out.sound = 1;
  if (truthy(raw.noClip)) out.noClip = 1;
  out.du = intOf(raw.duration);
  out.in = intOf(raw.interpolation);
  if (raw.axisCenter instanceof Int32Array && raw.axisCenter.length === 7) {
    out.center = raw.axisCenter;
  }
  out.aS = -1;
  if (Array.isArray(raw.events) && raw.events.length > 0) {
    ctx.warn("1.12 door events (sounds, child-door triggers) were dropped");
  }
}

/** The closed/opened AnimationState pair; `b` (backToBlockform) = !stay. */
function doorStates(
  raw: Record<string, unknown>,
  opened: Record<string, number>,
): Array<Record<string, unknown>> {
  const closed: Record<string, unknown> = { n: "closed" };
  const openedState: Record<string, unknown> = { n: "opened", ...opened };
  if (!truthy(raw.stayAnimated)) {
    closed.b = 1;
    openedState.b = 1;
  }
  return [closed, openedState];
}

const AXIS_ROT_KEYS = ["rX", "rY", "rZ"] as const;

/** Facing ordinal (DOWN,UP,NORTH,SOUTH,WEST,EAST) → opened-offset key + sign. */
const FACING_OFFSETS: ReadonlyArray<readonly ["oX" | "oY" | "oZ", number]> = [
  ["oY", -1],
  ["oY", 1],
  ["oZ", -1],
  ["oZ", 1],
  ["oX", -1],
  ["oX", 1],
];

/**
 * Convert a 1.12 structure compound to its modern (1.21) equivalent, or null
 * when the type cannot be carried over (caller flattens the instance). Only
 * the fields the modern type reads are written — 1.12-only leftovers (`sit`,
 * `opened`, `disableRightClick`, …) are dropped, never copied through.
 */
export function convertLtStructure(
  raw: Record<string, unknown>,
  ctx: LtStructureContext,
): Record<string, unknown> | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const modernId = LT_STRUCTURE_ID_MAP[id];
  if (!modernId || LT_STRUCTURE_UNSUPPORTED.has(id)) return null;

  const out: Record<string, unknown> = { id: modernId };
  convertBase(raw, out);

  switch (id) {
    case "door": {
      convertDoorCommon(raw, out, ctx);
      const axis = intOf(raw.axis);
      const rotation: Record<string, number> = { a: axis };
      let value: number;
      if (intOf(raw["rot-type"]) === 1) {
        value = typeof raw.degree === "number" ? raw.degree : 0;
        rotation.d = value;
      } else {
        const clockwise = truthy(raw.clockwise);
        rotation.c = clockwise ? 1 : 0;
        value = clockwise ? 90 : -90;
      }
      out.rotation = rotation;
      const rotKey = AXIS_ROT_KEYS[axis] ?? "rY";
      out.s = doorStates(raw, value !== 0 ? { [rotKey]: value } : {});
      out.t = [];
      break;
    }
    case "slidingDoor": {
      convertDoorCommon(raw, out, ctx);
      const direction = intOf(raw.direction);
      out.direction = direction;
      const distance = intOf(raw.distance);
      out.dis = distance;
      const grid = intOf(raw.grid) > 0 ? intOf(raw.grid) : 16;
      out.disG = grid;
      const [offKey, sign] = FACING_OFFSETS[direction] ?? FACING_OFFSETS[3];
      const off = (distance / grid) * sign;
      out.s = doorStates(raw, off !== 0 ? { [offKey]: off } : {});
      out.t = [];
      break;
    }
    case "chair":
      // `sit` is a live-session player ref — dropped.
      if (typeof raw.occupied === "number") out.occupied = raw.occupied;
      break;
    case "light":
      if (!truthy(raw.disableRightClick)) out.right = 1;
      break;
    case "blankomatic":
      if (typeof raw.white === "number") out.white = raw.white;
      break;
    case "structure_builder": {
      for (const key of ["sizeX", "sizeY", "thickness", "grid"] as const) {
        if (typeof raw[key] === "number") out[key] = raw[key];
      }
      if (typeof raw.type === "string") out.type = raw.type;
      if (typeof raw.block === "string") {
        const state = ctx.resolveBlockRef(raw.block);
        if (state !== null) out.state = state;
      }
      break;
    }
    default:
      // fixed, ladder, bed, storage, message, item_holder, noclip, workbench,
      // importer, exporter, particle_emitter: base rewrite only.
      break;
  }
  return out;
}
