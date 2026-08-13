import type { SchRing } from "../../../ui";
import type { PreviewRow } from "../../../ui";
import type { DiffEntry } from "../../../engine/types";
import type { ResolutionChoice } from "../../_store/conversion.slice";
import type { SchDiffEntry, SchStatus } from "../ui/sch-tokens";

// Pure helpers extracted verbatim from DiffPanel.tsx (B1) so they are
// independently testable and DiffPanel shrinks to composition + rendering.

// Missing and mod-only are merged into a single red "missing" group (mod-only
// rows carry a "mod" pill), so mod-only is bucketed under "missing".
export const GROUP_ORDER: SchStatus[] = ["missing", "state-changed", "renamed", "safe"];

/** Maps an engine status to its `diff.*` translation key. */
export const STATUS_KEY: Record<SchStatus, string> = {
  safe: "diff.safe",
  renamed: "diff.renamed",
  "state-changed": "diff.stateChanged",
  missing: "diff.missing",
  "mod-only": "diff.missing",
};

/** Collapse mod-only into the missing bucket for grouping + filtering. */
export function bucketOf(status: SchStatus): SchStatus {
  return status === "mod-only" ? "missing" : status;
}

export const RING_CLASS: Record<Exclude<SchRing, null>, string> = {
  safe: "ring-1 ring-ok/60",
  warn: "ring-1 ring-warn/60",
  bad: "ring-1 ring-bad/60",
};

/** Suffix-preserving remap: `create:oak_log` → `<targetNs>:oak_log`, if it exists. */
export function remapSuffix(blockId: string, targetSet: Set<string>, targetNs: string): string | null {
  const colon = blockId.indexOf(":");
  if (colon === -1) return null;
  const candidate = `${targetNs}:${blockId.slice(colon + 1)}`;
  return targetSet.has(candidate) ? candidate : null;
}

/** Rows shown in a source block's hover-preview card: status, count, then states. */
export function previewRowsFor(e: DiffEntry, t: (key: string) => string): PreviewRow[] {
  const rows: PreviewRow[] = [
    { label: t("diff.statusLabel"), value: t(STATUS_KEY[e.status]) },
    { label: t("diff.instancesLabel"), value: e.instanceCount.toLocaleString() },
  ];
  for (const [k, v] of Object.entries(e.block.states ?? {})) {
    rows.push({ label: k, value: String(v) });
  }
  return rows;
}

/** Adapt an engine DiffEntry to the presentational SchDiffEntry shape. */
export function toSchEntry(e: DiffEntry): SchDiffEntry {
  return {
    block: { id: e.block.id, namespace: e.block.namespace, states: e.block.states },
    status: e.status,
    instanceCount: e.instanceCount,
    autoCandidate: e.autoCandidate?.id,
    incompatibleStates: e.incompatibleStates,
  };
}

export interface DiffGroup {
  status: SchStatus;
  entries: DiffEntry[];
}

export interface DiffFilterState {
  filter: SchStatus | null;
  showSafe: boolean;
}

/** Predicate a caller supplies for free-text search (see `diff-search.ts`). */
export type DiffEntryMatch = (entry: DiffEntry) => boolean;

/**
 * Bucket, filter and sort a diff's entries into status-ordered groups.
 * `match` is injected rather than imported so this module stays independent of
 * the search implementation (RF-11 lives in `diff-search.ts`).
 */
export function buildGroups(
  diff: { entries: DiffEntry[] } | undefined,
  filters: DiffFilterState,
  match: DiffEntryMatch,
): DiffGroup[] {
  if (!diff) return [];
  const byStatus = new Map<SchStatus, DiffEntry[]>();
  for (const entry of diff.entries) {
    const bucket = bucketOf(entry.status);
    if (filters.filter && bucket !== filters.filter) continue;
    if (!filters.filter && !filters.showSafe && entry.status === "safe") continue;
    if (!match(entry)) continue;
    const list = byStatus.get(bucket) ?? [];
    list.push(entry);
    byStatus.set(bucket, list);
  }
  return GROUP_ORDER.filter((s) => byStatus.has(s)).map((status) => {
    let entries = byStatus.get(status)!;
    if (status === "missing") {
      entries = [...entries].sort((a, b) => b.instanceCount - a.instanceCount);
    }
    return { status, entries };
  });
}

export interface BulkGroup {
  namespace: string;
  entries: DiffEntry[];
  remap: number;
}

/** Unresolved missing / mod-only blocks grouped by namespace, for bulk rules. */
export function buildBulkGroups(
  diff: { entries: DiffEntry[] } | undefined,
  resolutions: Record<string, ResolutionChoice>,
  targetSet: Set<string>,
  targetNs: string,
): BulkGroup[] {
  if (!diff) return [];
  const byNs = new Map<string, DiffEntry[]>();
  for (const entry of diff.entries) {
    if (entry.status !== "missing" && entry.status !== "mod-only") continue;
    if (resolutions[entry.block.id]) continue;
    const list = byNs.get(entry.block.namespace) ?? [];
    list.push(entry);
    byNs.set(entry.block.namespace, list);
  }
  return [...byNs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([namespace, entries]) => ({
      namespace,
      entries,
      remap: entries.filter((e) => remapSuffix(e.block.id, targetSet, targetNs) !== null).length,
    }));
}
