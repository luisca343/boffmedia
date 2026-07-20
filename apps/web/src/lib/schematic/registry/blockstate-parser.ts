import type { BlockDefinition } from "../types";

/**
 * A Minecraft blockstate definition file (`assets/<ns>/blockstates/<name>.json`).
 * It uses either `variants` (keyed by a comma-separated `prop=value` string, or
 * `""` for stateless blocks) or `multipart` (a list of `{ when, apply }` rules).
 * Either way the *keys/conditions* enumerate the block's valid state values —
 * which is exactly what the diff engine needs.
 */
interface BlockstateJson {
  variants?: Record<string, unknown>;
  multipart?: Array<{ when?: unknown; apply?: unknown }>;
}

/** Accumulate a value into the `prop -> Set<value>` map. */
function add(acc: Map<string, Set<string>>, prop: string, value: string) {
  let set = acc.get(prop);
  if (!set) acc.set(prop, (set = new Set()));
  // `when` conditions may list alternatives as "true|false".
  for (const v of value.split("|")) {
    const trimmed = v.trim();
    if (trimmed) set.add(trimmed);
  }
}

/** Pull `prop=value` pairs out of a variants key like "facing=north,half=top". */
function collectFromVariantKey(acc: Map<string, Set<string>>, key: string) {
  if (!key) return;
  for (const pair of key.split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const prop = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (prop) add(acc, prop, value);
  }
}

/** Pull props out of a multipart `when` clause (supports OR/AND nesting). */
function collectFromWhen(acc: Map<string, Set<string>>, when: unknown) {
  if (!when || typeof when !== "object") return;
  for (const [key, value] of Object.entries(when as Record<string, unknown>)) {
    if (key === "OR" || key === "AND") {
      if (Array.isArray(value)) for (const sub of value) collectFromWhen(acc, sub);
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      add(acc, key, String(value));
    }
  }
}

/**
 * Parse a blockstate JSON into a {@link BlockDefinition}. Blockstate files do not
 * encode a default value per property, so the default is taken as the first
 * value seen for each property (good enough for state-fill on export; the diff's
 * validity check only needs the value sets).
 */
export function parseBlockstateJson(id: string, json: BlockstateJson): BlockDefinition {
  const acc = new Map<string, Set<string>>();

  if (json.variants) {
    for (const key of Object.keys(json.variants)) collectFromVariantKey(acc, key);
  }
  if (json.multipart) {
    for (const part of json.multipart) collectFromWhen(acc, part.when);
  }

  const validStates: Record<string, string[]> = {};
  const defaultState: Record<string, string> = {};
  for (const [prop, values] of acc) {
    const list = [...values];
    validStates[prop] = list;
    defaultState[prop] = list[0];
  }

  return { id, validStates, defaultState, tags: [] };
}
