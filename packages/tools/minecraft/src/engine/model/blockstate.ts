/**
 * Blockstate resolution: given a block's state properties, pick the model(s) to
 * render — one for `variants`, one-or-more for `multipart` (fences, walls, panes,
 * redstone, …).
 *
 * Pure functions over already-parsed JSON. No asset loading happens here; the
 * caller loads each returned {@link ModelRef}'s model.
 */

import { isForgeBlockstate, resolveForgeV1 } from "./forge-v1";
import type { Blockstate, ModelRef, MultipartWhen } from "./types";

type States = Record<string, string>;

function isForgeMarked(blockstate: Blockstate): boolean {
  return isForgeBlockstate(blockstate);
}

/** First element of a weighted variant/apply array, or the value itself. */
function firstRef(value: ModelRef | ModelRef[]): ModelRef {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse a variant key ("facing=north,half=bottom" | "") into property pairs.
 *
 * A segment with no `=` is not a property at all — it is a Forge v1 render case
 * (`normal`, `all`, `inventory`), which 1.12 double-slab blockstates use as their
 * only key. Splitting those on a missing `=` invents the pair
 * `["norma", "normal"]`, which can never match anything; they are unconditional.
 */
function parsePredicate(key: string): Array<[string, string]> {
  if (key === "") return [];
  const out: Array<[string, string]> = [];
  for (const pair of key.split(",")) {
    const eq = pair.indexOf("=");
    if (eq > 0) out.push([pair.slice(0, eq), pair.slice(eq + 1)]);
  }
  return out;
}

/** A blockstate value may list alternatives with `|` ("true" | "north|east|south"). */
function valueMatches(stateValue: string | undefined, expected: string): boolean {
  if (stateValue === undefined) return false;
  return expected.split("|").includes(stateValue);
}

/**
 * Score one variant key against the block's states.
 *
 * `-1` means *contradicted*: the block declares that property and its value is
 * something else, so this variant is disqualified. Otherwise the score is how
 * many pairs positively matched — a predicate naming a property the block does
 * not declare is neither a match nor a contradiction.
 *
 * That tolerance is deliberate. Pre-flattening blockstates carry properties the
 * modern normalizer has no equivalent for (1.12 keys purpur slabs
 * `half=top,variant=default`), and treating an unknown property as a failure
 * disqualified *every* variant, which is how a top slab ended up rendering as the
 * first-declared bottom one. Ranking instead of all-or-nothing keeps the
 * discriminating property (`half`) decisive and ignores the vestigial one.
 */
function scorePredicate(pairs: Array<[string, string]>, states: States): number {
  let score = 0;
  for (const [k, v] of pairs) {
    if (states[k] === undefined) continue;
    if (!valueMatches(states[k], v)) return -1;
    score++;
  }
  return score;
}

/**
 * Resolve `variants`: the best-scoring key that no state contradicts, preferring
 * the first declared on a tie.
 */
function resolveVariants(variants: Record<string, ModelRef | ModelRef[]>, states: States): ModelRef[] {
  let best: ModelRef | undefined;
  let bestScore = -1;
  for (const [key, value] of Object.entries(variants)) {
    const score = scorePredicate(parsePredicate(key), states);
    if (score > bestScore) {
      bestScore = score;
      best = firstRef(value);
    }
  }
  // Every variant contradicted (bestScore stays -1) — still better to draw the
  // block's first declared shape than nothing, but it is a guess.
  if (!best) {
    const first = Object.values(variants)[0];
    return first ? [firstRef(first)] : [];
  }
  return [best];
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
  // Shares the blockstates/ path with the vanilla format but is structured
  // differently; read as vanilla it yields nothing. See forge-v1.ts.
  // Called through a boolean wrapper on purpose: `isForgeBlockstate` is a type
  // guard, and every `Blockstate` field is optional, so narrowing on it leaves
  // the vanilla branches with a `never`-typed blockstate.
  if (isForgeMarked(blockstate)) return resolveForgeV1(blockstate, states);
  if (blockstate.variants) return resolveVariants(blockstate.variants, states);
  if (blockstate.multipart) return resolveMultipart(blockstate.multipart, states);
  return [];
}
