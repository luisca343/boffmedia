"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BoffButton } from "@/components/boffmedia/primitives/button";
import {
  SchIcon,
  FilterChips,
  MappingCard,
  BulkRulesSheet,
  type SchStatus,
  type SchDiffEntry,
  type SchRing,
  type BulkAction,
} from "@/components/boffmedia/ui/schematic";
import { useToolStore } from "../../_store/tool.store";
import type { DiffEntry } from "../../_lib/types";
import { BlockThumb, type PreviewRow } from "./BlockThumb";

// Missing and mod-only are merged into a single red "missing" group (mod-only
// rows carry a "mod" pill), so mod-only is bucketed under "missing".
const GROUP_ORDER: SchStatus[] = ["missing", "state-changed", "renamed", "safe"];

/** Maps an engine status to its `diff.*` translation key. */
const STATUS_KEY: Record<SchStatus, string> = {
  safe: "diff.safe",
  renamed: "diff.renamed",
  "state-changed": "diff.stateChanged",
  missing: "diff.missing",
  "mod-only": "diff.missing",
};

/** Collapse mod-only into the missing bucket for grouping + filtering. */
function bucketOf(status: SchStatus): SchStatus {
  return status === "mod-only" ? "missing" : status;
}

const RING_CLASS: Record<Exclude<SchRing, null>, string> = {
  safe: "ring-1 ring-success/60",
  warn: "ring-1 ring-warning/60",
  bad: "ring-1 ring-danger/60",
};

/** Suffix-preserving remap: `create:oak_log` → `<targetNs>:oak_log`, if it exists. */
function remapSuffix(blockId: string, targetSet: Set<string>, targetNs: string): string | null {
  const colon = blockId.indexOf(":");
  if (colon === -1) return null;
  const candidate = `${targetNs}:${blockId.slice(colon + 1)}`;
  return targetSet.has(candidate) ? candidate : null;
}

/** Rows shown in a source block's hover-preview card: status, count, then states. */
function previewRowsFor(e: DiffEntry, t: (key: string) => string): PreviewRow[] {
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
function toSchEntry(e: DiffEntry): SchDiffEntry {
  return {
    block: { id: e.block.id, namespace: e.block.namespace, states: e.block.states },
    status: e.status,
    instanceCount: e.instanceCount,
    autoCandidate: e.autoCandidate?.id,
    incompatibleStates: e.incompatibleStates,
  };
}

export function DiffPanel() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const diff = useToolStore((s) => s.diff);
  const isAnalyzing = useToolStore((s) => s.isAnalyzing);
  const targetBlockIds = useToolStore((s) => s.targetBlockIds);
  const resolutions = useToolStore((s) => s.resolutions);
  const setResolution = useToolStore((s) => s.setResolution);
  const clearResolution = useToolStore((s) => s.clearResolution);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const setSelectedBlock = useToolStore((s) => s.setSelectedBlock);
  const sourceVersion = useToolStore((s) => s.sourceReg?.version);
  const targetVersion = useToolStore((s) => s.targetReg?.version);
  const sourceRegId = useToolStore((s) => s.sourceReg?.id);
  const targetRegId = useToolStore((s) => s.targetReg?.id);
  const targetGame = useToolStore((s) => s.targetGame);

  // Bulk-rule targets follow the target game's namespace, not a hardcoded
  // "minecraft:" (which is wrong/absent when converting to Hytale).
  const targetNs = targetGame === "hytale" ? "hytale" : "minecraft";
  const airId = `${targetNs}:air`;

  const [query, setQuery] = useState("");
  const [showSafe, setShowSafe] = useState(false);
  const [filter, setFilter] = useState<SchStatus | null>(null);
  const [sheet, setSheet] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to the selected entry when the 3D viewer selects a block.
  useEffect(() => {
    if (!selectedBlockId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(selectedBlockId)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedBlockId]);

  const targetSet = useMemo(() => new Set(targetBlockIds), [targetBlockIds]);

  const groups = useMemo(() => {
    if (!diff) return [];
    const q = query.trim().toLowerCase();
    const byStatus = new Map<SchStatus, DiffEntry[]>();
    for (const entry of diff.entries) {
      const bucket = bucketOf(entry.status);
      if (filter && bucket !== filter) continue;
      if (!filter && !showSafe && entry.status === "safe") continue;
      if (q && !entry.block.id.toLowerCase().includes(q)) continue;
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
  }, [diff, query, showSafe, filter]);

  // Unresolved missing / mod-only blocks grouped by namespace, for bulk rules.
  const bulkGroups = useMemo(() => {
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
  }, [diff, resolutions, targetSet, targetNs]);

  const unresolved = bulkGroups.reduce((s, g) => s + g.entries.length, 0);

  function applyBulk(actions: Record<string, BulkAction>) {
    for (const g of bulkGroups) {
      const a = actions[g.namespace] ?? "skip";
      if (a === "skip") continue;
      for (const e of g.entries) {
        if (a === "air") setResolution(e.block, airId);
        else {
          const target = remapSuffix(e.block.id, targetSet, targetNs);
          if (target) setResolution(e.block, target);
        }
      }
    }
    setSheet(false);
  }

  if (!diff) {
    return (
      <div className="m-4 p-[2.5rem_1.5rem] border-[1.5px] border-dashed border-edge rounded-[var(--radius-lg)] text-center text-ink-dim flex flex-col items-center gap-[0.7rem]">
        <SchIcon name="layers" size={34} className="text-ink-dim opacity-70" />
        <h3 className="font-display text-[length:var(--t-lg)] text-ink-muted">{t("diff.emptyTitle")}</h3>
        <p className="text-[length:var(--t-sm)] max-w-[34ch]">
          {isAnalyzing ? t("diff.analyzing") : t("diff.emptyPrompt")}
        </p>
      </div>
    );
  }

  const chips = [
    { key: "safe" as SchStatus, label: t("diff.safe"), count: diff.summary.safe },
    { key: "renamed" as SchStatus, label: t("diff.renamed"), count: diff.summary.renamed },
    { key: "state-changed" as SchStatus, label: t("diff.stateChanged"), count: diff.summary.stateChanged },
    // Missing + mod-only are one red "missing" category.
    { key: "missing" as SchStatus, label: t("diff.missing"), count: diff.summary.missing + diff.summary.modOnly },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* diff bar */}
      <div className="shrink-0 sticky top-0 z-[8] flex flex-col gap-[0.7rem] p-[0.85rem] border-b border-edge bg-[color-mix(in_srgb,var(--layer-1)_86%,transparent)] backdrop-blur-[8px]">
        <FilterChips chips={chips} active={filter} onToggle={(k) => setFilter((c) => (c === k ? null : k))} />
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SchIcon name="search" size={16} className="absolute left-[0.6rem] top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("diff.searchPlaceholder")}
              className="w-full font-body text-[length:var(--t-sm)] text-ink bg-layer-2 border border-edge-strong rounded-[var(--btn-radius)] pl-8 pr-[0.9rem] py-2 transition-[border-color] duration-[var(--dur)] ease-[var(--ease)] placeholder:text-ink-dim hover:border-[color-mix(in_srgb,var(--text)_28%,transparent)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSafe((v) => !v)}
            disabled={filter !== null}
            className={
              "shrink-0 py-2 px-[0.7rem] rounded-[var(--radius)] border text-[length:var(--t-xs)] cursor-pointer whitespace-nowrap transition-all duration-[var(--dur)] ease-[var(--ease)] disabled:opacity-40 disabled:cursor-default " +
              (showSafe
                ? "text-[color:var(--accent-bright)] border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--accent-soft)]"
                : "border-edge-strong bg-layer-2 text-ink-muted hover:text-ink")
            }
          >
            {showSafe ? t("diff.hideSafe") : t("diff.showSafe")}
          </button>
          {unresolved > 0 ? (
            <BoffButton variant="ghost" size="sm" onClick={() => setSheet(true)} className="shrink-0">
              <SchIcon name="layers" size={16} />
              {t("diff.bulkRules")}
              <span className="ml-0.5 py-[0.05rem] px-[0.4rem] rounded-[var(--radius-pill)] bg-layer-2 text-ink-muted font-mono text-[10px]">
                {unresolved}
              </span>
            </BoffButton>
          ) : null}
        </div>
      </div>

      {/* list */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-[0.85rem] flex flex-col gap-[1.1rem]">
        {groups.length === 0 ? (
          <div className="my-4 text-center text-[length:var(--t-sm)] text-ink-dim">
            {t("diff.noMatching")}
          </div>
        ) : (
          groups.map((group) => {
            return (
              <section key={group.status} className="flex flex-col gap-[0.5rem]">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-ink-dim font-bold">
                  {t(STATUS_KEY[group.status])}
                  <span className="py-[0.05rem] px-[0.4rem] rounded-[var(--radius-pill)] bg-layer-2 text-ink-muted">
                    {group.entries.length}
                  </span>
                </div>
                {/* 2–3 column grid (by available width) so block thumbnails get room. */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[0.5rem]">
                  {group.entries.map((entry) => {
                    const sch = toSchEntry(entry);
                    const selected = selectedBlockId === entry.block.id;
                    const onSelect = () => setSelectedBlock(selected ? undefined : entry.block.id);
                    const onResolve = (blockId: string, target: string) => {
                      if (target) setResolution(entry.block, target);
                      else clearResolution(blockId);
                    };
                    const renderThumb = (id: string, size: number, ring?: SchRing): ReactNode => {
                      const isSource = id === entry.block.id;
                      return (
                        <BlockThumb
                          blockId={id}
                          version={isSource ? sourceVersion : targetVersion}
                          registryId={isSource ? sourceRegId : targetRegId}
                          size={size}
                          ringClassName={ring ? RING_CLASS[ring] : undefined}
                          previewRows={isSource ? previewRowsFor(entry, t) : undefined}
                          // Always lazy: the replacement dropdown renders the whole
                          // target registry (thousands of blocks), so eager loading
                          // would fire thousands of texture fetches on open. Visible
                          // row/card thumbs still load immediately via the observer.
                          lazy
                        />
                      );
                    };
                    return (
                      <div key={entry.block.id} data-block-id={entry.block.id} className="min-w-0">
                        <MappingCard
                          entry={sch}
                          options={targetBlockIds}
                          resolution={resolutions[entry.block.id]?.targetId}
                          onResolve={onResolve}
                          selected={selected}
                          onSelect={onSelect}
                          renderThumb={renderThumb}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      <BulkRulesSheet open={sheet} groups={bulkGroups} onClose={() => setSheet(false)} onApply={applyBulk} />
    </div>
  );
}
