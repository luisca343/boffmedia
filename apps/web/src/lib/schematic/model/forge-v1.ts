/**
 * Forge blockstate format ("v1") → renderable {@link ModelRef} list.
 *
 * `registry/forge-blockstate.ts` already reads this format, but only to enumerate
 * a block's states and pick one representative texture. Drawing the block needs
 * the other half: which models a *given* state composes, and with which texture
 * overrides. Without it every modded block fell back to a flat cube — and v1 is
 * not a niche case, it is how 1.12 mods overwhelmingly ship (Fureniku's Roads
 * 433/435 blockstates, Cooking for Blockheads 17/17).
 *
 * The format is closer to vanilla `multipart` than to `variants`:
 *
 * ```json
 * { "forge_marker": 1,
 *   "defaults": { "model": "ns:single_middle", "textures": {"0": "ns:blocks/paint"} },
 *   "variants": {
 *     "meta":   { "0": {"model": "ns:tile_full"}, "1": {"model": "ns:tile_full", "y": 90} },
 *     "east":   { "true": {"submodel": {"paint_east": {"model": "ns:line_n", "y": 90}}},
 *                 "false": {} } } }
 * ```
 *
 * Each top-level key is a *property name*; the block's current value of that
 * property selects one entry, and every selected entry contributes its submodels.
 * So `east=true,west=true` draws both arms — the same accumulate-the-matches
 * semantics vanilla spells out with `when`/`apply`.
 *
 * Two things this deliberately does not do. `transform` is item-display data
 * (ground/gui/fixed) and never affects the block in world, so it is dropped. And
 * `inventory*` keys are render cases, not properties — matching them would draw
 * the item model in the world.
 */

import { isForgeBlockstate, type ForgeBlockstateJson } from "../registry/forge-blockstate";
import type { ModelRef } from "./types";

export { isForgeBlockstate };

/** Keys that name a render case rather than a block property. */
function isRenderCase(key: string): boolean {
  return key === "normal" || key === "inventory" || key.startsWith("inventory_");
}

interface V1Entry {
  model?: string;
  x?: number;
  y?: number;
  uvlock?: boolean;
  textures?: Record<string, string>;
  submodel?: unknown;
}

/**
 * Mods ship an explicit empty model to mean "draw nothing here" — Fureniku's
 * Roads names it `nomodel`. It is a decision, not a missing asset.
 */
function isNoModel(model: string): boolean {
  return /(^|[:/])nomodel$/.test(model);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** A variant slot may be written as the entry itself or as a one-element list. */
function asEntry(value: unknown): V1Entry | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return isPlainObject(v) ? (v as V1Entry) : undefined;
}

/**
 * Entries selected by the block's states, in declaration order.
 *
 * A property the block does not declare selects nothing — guessing a value would
 * invent geometry (an arm on a road tile that has no such connection). The
 * vanilla-style combination key (`"variant=stone"`) is accepted too because v1
 * permits both spellings and mods mix them freely.
 */
function selectEntries(json: ForgeBlockstateJson, states: Record<string, string>): V1Entry[] {
  const out: V1Entry[] = [];
  for (const [key, value] of Object.entries(json.variants ?? {})) {
    if (isRenderCase(key)) continue;

    if (key.includes("=")) {
      const matches = key.split(",").every((pair) => {
        const eq = pair.indexOf("=");
        if (eq <= 0) return false;
        return states[pair.slice(0, eq).trim()] === pair.slice(eq + 1).trim();
      });
      if (matches) {
        const entry = asEntry(value);
        if (entry) out.push(entry);
      }
      continue;
    }

    if (!isPlainObject(value)) continue;
    const selected = states[key];
    if (selected === undefined) continue;
    const entry = asEntry(value[selected]);
    if (entry) out.push(entry);
  }
  return out;
}

/**
 * The first entry, in declaration order across every property, that names a
 * model — the block's representative shape.
 *
 * Needed because a v1 block need not declare `defaults.model` at all: Cooking for
 * Blockheads' `fridge.json` names its body only under `type=small`, and its door
 * and hinge only under `flipped`. A pre-flattening schematic carries none of those
 * properties (the metadata→property mapping lives in the mod's Java, never in its
 * assets), so nothing matched and the fridge drew *nothing*.
 *
 * Only the model is taken, never the submodels. Submodels are the parts a state
 * legitimately adds — a road tile's connecting arms, a fridge's door — and
 * inventing those from an unmatched state would draw connections the block does
 * not have. A body without its door is the honest degradation.
 */
function representativeModel(json: ForgeBlockstateJson): V1Entry | undefined {
  for (const [key, value] of Object.entries(json.variants ?? {})) {
    if (isRenderCase(key) || !isPlainObject(value)) continue;
    const slots = key.includes("=") ? [value] : Object.values(value);
    for (const slot of slots) {
      const entry = asEntry(slot);
      if (entry?.model) return entry;
    }
  }
  return undefined;
}

/**
 * Expand `submodel` into `[slot name, entry]` pairs.
 *
 * The slot name is load-bearing, not decoration: Forge keys submodels by it, so a
 * later property writing the same slot *replaces* the earlier one. Fureniku's
 * Roads depends on this — a painted line declares `paint_north` under both
 * `facing=north_south` and `north=true`, and a barrier declares `connect_north`
 * as a generic widget under its always-true `zz_default_stuff` and again as the
 * real connector under `north=true`. Appending instead of replacing draws both
 * copies in the same place, which reads as z-fighting on every line and barrier.
 *
 * A bare string `submodel` has no name; it gets one keyed to nothing else so it
 * cannot collide.
 */
function submodelEntries(submodel: unknown): Array<[string, V1Entry]> {
  if (typeof submodel === "string") return [["", { model: submodel }]];
  if (!isPlainObject(submodel)) return [];
  const out: Array<[string, V1Entry]> = [];
  for (const [slot, part] of Object.entries(submodel)) {
    const entry = asEntry(part);
    if (entry?.model) out.push([slot, entry]);
  }
  return out;
}

/**
 * Resolve a Forge v1 blockstate into the model refs one block state draws.
 *
 * The base model's *shape* is named once — by whichever selected entry names its
 * own `model` (that is how a `meta`-keyed block picks its shape and rotation),
 * else by `defaults`. But properties are independent (that is the whole premise
 * of this format — `facing` and `color` are declared and matched separately), so
 * every selected entry's `x`/`y`/`uvlock`/`textures` are folded into that one base
 * ref, not just the model-naming entry's. Without this, a texture- or
 * rotation-only entry (no `model`, no `submodel` — Cooking for Blockheads'
 * `facing`/`color` on `counter.json` is exactly this shape) matched but
 * contributed nothing: the block always rendered unrotated and unrecolored.
 * Submodels from *every* selected entry are then added on top. Emitting the base
 * per matched property instead would stack duplicate copies of the same
 * geometry, which reads as z-fighting rather than as a missing model.
 */
export function resolveForgeV1(
  json: ForgeBlockstateJson,
  states: Record<string, string>,
): ModelRef[] {
  const defaults = (json.defaults ?? {}) as V1Entry;
  const selected = selectEntries(json, states);

  const refFor = (entry: V1Entry, model: string): ModelRef => ({
    model,
    x: entry.x ?? defaults.x ?? 0,
    y: entry.y ?? defaults.y ?? 0,
    uvlock: entry.uvlock ?? defaults.uvlock ?? false,
    textures: { ...(defaults.textures ?? {}), ...(entry.textures ?? {}) },
  });

  const out: ModelRef[] = [];

  // LAST selected entry naming a model wins, not the first: `model` on an entry
  // replaces the base rather than adding to it. Fureniku's Roads leans on both
  // directions of that — a `rotation` entry names `nomodel` with a `y` purely to
  // turn the block without changing its shape, and `zz_default_stuff` names
  // `nomodel` to declare that this block has no base body at all (a barrier is
  // entirely posts and connectors). Treating `nomodel` as "nothing named a model"
  // instead would fall through to `defaults.model` — the block's *item* model —
  // and draw a whole second barrier in one fixed orientation.
  let modelEntry: V1Entry | undefined;
  for (const entry of selected) if (entry.model) modelEntry = entry;
  const baseModel = modelEntry
    ? modelEntry.model
    : (defaults.model ?? representativeModel(json)?.model);
  if (baseModel) {
    let merged: V1Entry = {};
    for (const entry of selected) {
      merged = {
        x: entry.x ?? merged.x,
        y: entry.y ?? merged.y,
        uvlock: entry.uvlock ?? merged.uvlock,
        textures: { ...merged.textures, ...entry.textures },
      };
    }
    out.push(refFor(merged, baseModel));
  }

  // Slot -> ref, so a later property replaces an earlier one's part rather than
  // drawing on top of it. Insertion order is preserved, so replacing a slot keeps
  // its original position in the draw order.
  const slots = new Map<string, ModelRef>();
  let anonymous = 0;
  for (const entry of selected) {
    for (const [slot, sub] of submodelEntries(entry.submodel)) {
      // A submodel inherits its parent entry's texture overrides, then its own.
      const ref = refFor(
        { ...sub, textures: { ...(entry.textures ?? {}), ...(sub.textures ?? {}) } },
        sub.model as string,
      );
      slots.set(slot || ` anon${anonymous++}`, ref);
    }
  }

  out.push(...slots.values());

  // The placeholder is a real answer, not a miss — it is how a barrier with no
  // post suppresses one, and how `zz_default_stuff` says "no base body". Dropping
  // it here keeps it out of the model chain, which would only come back empty.
  return out.filter((ref) => !isNoModel(ref.model));
}
