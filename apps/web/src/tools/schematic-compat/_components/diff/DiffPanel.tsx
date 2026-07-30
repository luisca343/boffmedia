"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon } from "@/components/boffmedia/primitives";
import type { SchRing } from "@/components/boffmedia/ui/schematic";
import { FilterChips } from "./FilterChips";
import { MappingCard, MAPPING_CARD_HEIGHT } from "./MappingCard";
import { BulkRulesSheet } from "./BulkRulesSheet";
import { StructuresSection } from "./StructuresSection";
import {
  RING_CLASS,
  STATUS_KEY,
  buildBulkGroups,
  buildGroups,
  previewRowsFor,
  remapSuffix,
  toSchEntry,
  type DiffGroup,
} from "./diff-groups";
import { entryMatches } from "./diff-search";
import { useGridWindow } from "./grid-window";
import type { BulkAction, SchStatus } from "../ui/sch-tokens";
import { selectEnv, useToolStore } from "../../_store/tool.store";
import type { ResolutionChoice } from "../../_store/conversion.slice";
import type { DiffEntry } from "@/lib/schematic/types";
import { BlockThumb } from "@/components/boffmedia/ui/schematic";

/** Row stride for the windowed grids: card height + the grid's own row gap (`gap-[0.5rem]`). */
const GRID_GAP = 8;
const MIN_COL_WIDTH = 260;

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
  const sourceEnv = useToolStore(selectEnv("source"));
  const targetEnv = useToolStore(selectEnv("target"));
  const sourceVersion = sourceEnv.registry?.version;
  const targetVersion = targetEnv.registry?.version;
  const sourceRegId = sourceEnv.registry?.id;
  const targetRegId = targetEnv.registry?.id;
  const targetGame = targetEnv.game;

  // Bulk-rule targets follow the target game's namespace, not a hardcoded
  // "minecraft:" (which is wrong/absent when converting to Hytale).
  const targetNs = targetGame === "hytale" ? "hytale" : "minecraft";
  const airId = `${targetNs}:air`;

  // RF-12: query/showSafe/filter live in their own slice so they survive
  // DiffPanel unmounting under the E-front tabbed layout.
  const query = useToolStore((s) => s.query);
  const setQuery = useToolStore((s) => s.setQuery);
  const showSafe = useToolStore((s) => s.showSafe);
  const setShowSafe = useToolStore((s) => s.setShowSafe);
  const filter = useToolStore((s) => s.filter);
  const setFilter = useToolStore((s) => s.setFilter);
  const [sheet, setSheet] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const targetSet = useMemo(() => new Set(targetBlockIds), [targetBlockIds]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buildGroups(diff, { filter, showSafe }, (entry) =>
      entryMatches(entry, q, resolutions[entry.block.id]?.targetId ?? entry.autoCandidate?.id),
    );
    // resolutions is a dependency (previously omitted) so RF-11 target matching re-derives.
  }, [diff, query, showSafe, filter, resolutions]);

  const bulkGroups = useMemo(() => buildBulkGroups(diff, resolutions, targetSet, targetNs), [diff, resolutions, targetSet, targetNs]);

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
      <div className="flex-1 grid place-items-center p-6">
        <div className="text-center text-txt-dim flex flex-col items-center gap-2.5 max-w-[36ch]">
          <Icon name="layers" size={34} className="text-txt-dim opacity-70" />
          <h3 className="font-display font-extrabold uppercase tracking-[0.02em] text-[22px] text-txt-muted">
            {t("diff.emptyTitle")}
          </h3>
          <p className="text-[13px]">{isAnalyzing ? t("diff.analyzing") : t("diff.emptyPrompt")}</p>
        </div>
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
      <div className="shrink-0 sticky top-0 z-[5] flex flex-col gap-[11px] py-[13px] px-4 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-[8px]">
        <FilterChips chips={chips} active={filter} onToggle={(k) => setFilter(filter === k ? null : k)} />
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-2.5 h-8 bg-panel border border-solid border-line text-txt-dim focus-within:border-accent-line focus-within:text-txt-muted">
            <Icon name="search" size={14} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("diff.searchPlaceholder")}
              aria-label={t("diff.searchPlaceholder")}
              className="flex-1 min-w-0 font-mono text-[12px] text-txt bg-transparent border-0 outline-none placeholder:text-txt-dim"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSafe(!showSafe)}
            disabled={filter !== null}
            className={
              "shrink-0 h-8 px-[11px] border border-solid font-mono text-[11px] cursor-pointer whitespace-nowrap transition-[color,border-color,background] duration-[140ms] disabled:opacity-40 disabled:cursor-default " +
              (showSafe
                ? "text-accent-bright border-accent-line bg-accent-soft"
                : "border-line bg-panel text-txt-muted enabled:hover:text-txt enabled:hover:border-line-2")
            }
          >
            {showSafe ? t("diff.hideSafe") : t("diff.showSafe")}
          </button>
          {unresolved > 0 ? (
            <Button variant="ghost" size="sm" icon="layers" onClick={() => setSheet(true)} className="shrink-0">
              {t("diff.bulkRules")}
              <span className="grid place-items-center min-w-[18px] h-4 px-1 bg-accent text-accent-ink font-mono text-[10px] font-semibold">
                {unresolved}
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* list */}
      {/*
        scrollbar-gutter:stable is a windowing invariant, not cosmetics: without
        it this container's clientWidth changes when the scrollbar appears,
        which changes each grid's column count, which changes its reserved
        height, which decides whether the scrollbar is there at all
        (useGridWindow's convergence note).
      */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] py-3.5 px-4 flex flex-col gap-4">
        <StructuresSection />
        {groups.length === 0 ? (
          <div className="text-center text-[13px] text-txt-dim py-[30px]">{t("diff.noMatching")}</div>
        ) : (
          groups.map((group) => (
            <GroupGrid
              key={group.status}
              group={group}
              scrollRef={listRef}
              selectedBlockId={selectedBlockId}
              targetBlockIds={targetBlockIds}
              resolutions={resolutions}
              sourceVersion={sourceVersion}
              targetVersion={targetVersion}
              sourceRegId={sourceRegId}
              targetRegId={targetRegId}
              t={t}
              onSelect={(id) => setSelectedBlock(selectedBlockId === id ? undefined : id)}
              onResolve={(entry, blockId, target) => {
                if (target) setResolution(entry.block, target);
                else clearResolution(blockId);
              }}
            />
          ))
        )}
      </div>

      <BulkRulesSheet open={sheet} groups={bulkGroups} onClose={() => setSheet(false)} onApply={applyBulk} />
    </div>
  );
}

/**
 * One status section's grid, windowed independently (B2/RF-09). Rendered as a
 * component (not a hook called inside the parent's .map()) so each section
 * owns its own `useGridWindow` instance without breaking the rules of hooks.
 */
function GroupGrid({
  group,
  scrollRef,
  selectedBlockId,
  targetBlockIds,
  resolutions,
  sourceVersion,
  targetVersion,
  sourceRegId,
  targetRegId,
  t,
  onSelect,
  onResolve,
}: {
  group: DiffGroup;
  scrollRef: RefObject<HTMLDivElement | null>;
  selectedBlockId?: string;
  targetBlockIds: string[];
  resolutions: Record<string, ResolutionChoice>;
  sourceVersion?: string;
  targetVersion?: string;
  sourceRegId?: string;
  targetRegId?: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  onSelect: (id: string) => void;
  onResolve: (entry: DiffEntry, blockId: string, target: string) => void;
}) {
  const { gridRef, columns, startRow, endRow, topPad, bottomPad, reservedHeight, scrollToIndex } = useGridWindow(scrollRef, {
    itemCount: group.entries.length,
    rowHeight: MAPPING_CARD_HEIGHT + GRID_GAP,
    minColWidth: MIN_COL_WIDTH,
    gap: GRID_GAP,
  });

  // RF-10: fly the windowed grid to the selected entry's row when the 3D
  // viewer selects a block that is off-screen (replaces the old
  // querySelector(...).scrollIntoView effect, which cannot find a DOM node
  // for a row that windowing never mounted).
  useEffect(() => {
    if (!selectedBlockId) return;
    const index = group.entries.findIndex((e) => e.block.id === selectedBlockId);
    if (index === -1) return;
    scrollToIndex(index);
  }, [selectedBlockId, group.entries, scrollToIndex]);

  const cols = columns || 1;
  const start = Math.min(startRow * cols, group.entries.length);
  const end = Math.min((endRow + 1) * cols, group.entries.length);
  const visible = group.entries.slice(start, end);

  return (
    <section className="flex flex-col gap-[7px]">
      <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.12em] uppercase text-txt-muted">
        {t(STATUS_KEY[group.status])}
        <span className="grid place-items-center min-w-[18px] h-4 px-1 bg-panel-2 text-txt-dim font-semibold">
          {group.entries.length}
        </span>
      </div>
      {/* 2–3 column grid (by available width) so block thumbnails get room. */}
      {/*
        `reservedHeight` pins the box while windowing so its height is a
        function of (entry count, columns) only, never of the mounted row range
        — that independence is what stops the measure loop. `content-start` is
        required with it: a grid with an explicit height stretches its
        auto-sized rows to fill the leftover space, which would inflate every
        card past MAPPING_CARD_HEIGHT and break the row-stride arithmetic.
      */}
      <div
        ref={gridRef}
        style={{ paddingTop: topPad, paddingBottom: bottomPad, height: reservedHeight }}
        className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] content-start gap-[0.5rem]"
      >
        {visible.map((entry) => {
          const sch = toSchEntry(entry);
          const selected = selectedBlockId === entry.block.id;
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
          // A block id is only unique WITHIN one diffPopulation() pass — the
          // same id can get a second, separate DiffEntry when it also shows up
          // as a LittleTiles material (see _lib/pipeline/diff.ts's two calls,
          // one per population). `context` is what tells those apart, so it
          // has to be part of the key; `data-block-id` stays id-only since
          // RF-10's scrollToIndex/selection matching intentionally lands on
          // the first entry with that id.
          return (
            <div
              key={`${entry.context ?? "block"}:${entry.block.id}`}
              data-block-id={entry.block.id}
              className="min-w-0"
            >
              <MappingCard
                entry={sch}
                options={targetBlockIds}
                resolution={resolutions[entry.block.id]?.targetId}
                onResolve={(blockId, target) => onResolve(entry, blockId, target)}
                selected={selected}
                onSelect={() => onSelect(entry.block.id)}
                renderThumb={renderThumb}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
