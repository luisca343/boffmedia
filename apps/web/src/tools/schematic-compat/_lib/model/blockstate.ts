/**
 * Blockstate resolution: given a block's state properties, pick the model(s) to
 * render — one for `variants`, one-or-more for `multipart` (fences, walls, panes,
 * redstone, …).
 *
 * Pure functions over already-parsed JSON. No asset loading happens here; the
 * caller loads each returned {@link ModelRef}'s model.
 */

import type { Blockstate, ModelRef, MultipartWhen } from "./types";

type States = Record<string, string>;

/** First element of a weighted variant/apply array, or the value itself. */
function firstRef(value: ModelRef | ModelRef[]): ModelRef {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse a variant key ("facing=north,half=bottom" | "") into property pairs. */
function parsePredicate(key: string): Array<[string, string]> {
  if (key === "") return [];
  return key.split(",").map((pair) => {
    const eq = pair.indexOf("=");
    return [pair.slice(0, eq), pair.slice(eq + 1)] as [string, string];
  });
}

/** A blockstate value may list alternatives with `|` ("true" | "north|east|south"). */
function valueMatches(stateValue: string | undefined, expected: string): boolean {
  if (stateValue === undefined) return false;
  return expected.split("|").includes(stateValue);
}

function predicateMatches(pairs: Array<[string, string]>, states: States): boolean {
  return pairs.every(([k, v]) => valueMatches(states[k], v));
}

/** Resolve `variants`: the first key whose every `k=v` holds (or `""`). */
function resolveVariants(variants: Record<string, ModelRef | ModelRef[]>, states: States): ModelRef[] {
  let fallback: ModelRef | undefined;
  for (const [key, value] of Object.entries(variants)) {
    const pairs = parsePredicate(key);
    if (pairs.length === 0) fallback = firstRef(value);
    if (predicateMatches(pairs, states)) return [firstRef(value)];
  }
  if (fallback) return [fallback];
  const first = Object.values(variants)[0];
  return first ? [firstRef(first)] : [];
}

/** Evaluate a multipart `when` clause against the block's states. */
function whenMatches(when: MultipartWhen | undefined, states: States): boolean {
  if (!when) return true;
  // The Record branch has a string index signature, so `"OR" in when` can't
  // discriminate the union — probe the array shape directly instead.
  const w = when as { OR?: Array<Record<string, string>>; AND?: Array<Record<string, string>> };
  if (Array.isArray(w.OR)) return w.OR.some((clause) => recordMatches(clause, states));
  if (Array.isArray(w.AND)) return w.AND.every((clause) => recordMatches(clause, states));
  return recordMatches(when as Record<string, string>, states);
}

function recordMatches(record: Record<string, string>, states: States): boolean {
  return Object.entries(record).every(([k, v]) => valueMatches(states[k], v));
}

/** Resolve `multipart`: every part whose `when` holds contributes its model. */
function resolveMultipart(
  parts: NonNullable<Blockstate["multipart"]>,
  states: States,
): ModelRef[] {
  const out: ModelRef[] = [];
  for (const part of parts) {
    if (whenMatches(part.when, states)) out.push(firstRef(part.apply));
  }
  return out;
}

/**
 * Pick the model reference(s) for a block's state. Returns an empty array when
 * the blockstate is malformed — the caller then falls back to a plain cube.
 */
export function resolveModelRefs(blockstate: Blockstate, states: States): ModelRef[] {
  if (blockstate.variants) return resolveVariants(blockstate.variants, states);
  if (blockstate.multipart) return resolveMultipart(blockstate.multipart, states);
  return [];
}
