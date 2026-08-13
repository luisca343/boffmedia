import type { DiffEntry } from "../../../engine/types";

/**
 * RF-11: widened DiffPanel search — matches the full block id, its namespace
 * segment, each blockstate key/value, and the resolved replacement target
 * (caller passes `resolutions[entry.block.id]?.targetId ?? entry.autoCandidate?.id`
 * so this module stays independent of `conversion.slice.ts`). Plain
 * case-insensitive substring across those fields — fuse.js is present in the
 * repo but unused here, since RF-11 asks for wider field coverage, not fuzzy
 * ranking.
 */
export function entryMatches(entry: DiffEntry, query: string, resolvedTargetId?: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (entry.block.id.toLowerCase().includes(q)) return true;
  if (entry.block.namespace.toLowerCase().includes(q)) return true;

  for (const [k, v] of Object.entries(entry.block.states ?? {})) {
    if (k.toLowerCase().includes(q)) return true;
    if (String(v).toLowerCase().includes(q)) return true;
  }

  if (resolvedTargetId && resolvedTargetId.toLowerCase().includes(q)) return true;

  return false;
}
