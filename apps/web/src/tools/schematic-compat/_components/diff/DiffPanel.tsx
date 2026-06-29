"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { useToolStore } from "../../_store/tool.store";
import type { DiffEntry } from "../../_lib/types";
import { DiffSummaryBar, type StatusFilter } from "./DiffSummaryBar";
import { DiffEntryRow } from "./DiffEntryRow";

const GROUP_ORDER: DiffEntry["status"][] = [
  "missing",
  "mod-only",
  "state-changed",
  "renamed",
  "safe",
];

export function DiffPanel() {
  const t = useTranslations("games.minecraft.schematicCompat.diff");
  const diff = useToolStore((s) => s.diff);
  const isAnalyzing = useToolStore((s) => s.isAnalyzing);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const [query, setQuery] = useState("");
  const [showSafe, setShowSafe] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to the selected entry when the 3D viewer selects a block.
  useEffect(() => {
    if (!selectedBlockId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-block-id="${CSS.escape(selectedBlockId)}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedBlockId]);

  const groups = useMemo(() => {
    if (!diff) return [];
    const q = query.trim().toLowerCase();
    const byStatus = new Map<DiffEntry["status"], DiffEntry[]>();
    for (const entry of diff.entries) {
      if (filter && entry.status !== filter) continue;
      if (!filter && !showSafe && entry.status === "safe") continue;
      if (q && !entry.block.id.toLowerCase().includes(q)) continue;
      const list = byStatus.get(entry.status) ?? [];
      list.push(entry);
      byStatus.set(entry.status, list);
    }
    return GROUP_ORDER.filter((s) => byStatus.has(s)).map((status) => {
      let entries = byStatus.get(status)!;
      if (status === "missing" || status === "mod-only") {
        entries = [...entries].sort((a, b) => b.instanceCount - a.instanceCount);
      }
      return { status, entries };
    });
  }, [diff, query, showSafe, filter]);

  if (!diff) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          {t("header")}
        </h2>
        <div className="rounded-md border border-dashed border-edge/60 p-8 text-center text-sm text-ink-dim">
          {isAnalyzing ? t("analyzing") : t("emptyPrompt")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 space-y-3 border-b border-edge/40 bg-layer-1/80 p-4 backdrop-blur-sm">
        <DiffSummaryBar
          summary={diff.summary}
          active={filter}
          onToggle={(status) => setFilter((cur) => (cur === status ? null : status))}
        />
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSafe((v) => !v)}
            disabled={filter !== null}
            className="shrink-0 rounded-md border border-edge/50 px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:bg-layer-2/50 disabled:opacity-40"
          >
            {showSafe ? t("hideSafe") : t("showSafe")}
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {groups.length === 0 ? (
          <div className="text-center text-sm text-ink-dim">{t("noMatching")}</div>
        ) : (
          groups.map((group) => (
            <section key={group.status} className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
                {t(statusKey(group.status))} ({group.entries.length})
              </h3>
              <div className={group.status === "missing" || group.status === "mod-only" ? "space-y-0.5" : "space-y-1.5"}>
                {group.entries.map((entry) => (
                  <DiffEntryRow key={entry.block.id} entry={entry} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function statusKey(status: DiffEntry["status"]): string {
  switch (status) {
    case "state-changed":
      return "stateChanged";
    case "mod-only":
      return "modOnly";
    default:
      return status;
  }
}
