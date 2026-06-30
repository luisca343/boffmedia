"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/primitives/sheet";
import { useToolStore } from "../../_store/tool.store";
import type { DiffEntry } from "../../_lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupAction = "skip" | "remap" | "air";

interface NsGroup {
  namespace: string;
  entries: DiffEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Attempt a suffix-preserving remap: `create:oak_log` → `minecraft:oak_log`.
 * Returns the target block id if it exists in `targetBlockIds`, else null.
 */
function remapSuffix(blockId: string, targetBlockIds: Set<string>): string | null {
  const colon = blockId.indexOf(":");
  if (colon === -1) return null;
  const suffix = blockId.slice(colon + 1);
  const candidate = `minecraft:${suffix}`;
  return targetBlockIds.has(candidate) ? candidate : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkRulesDrawer() {
  const t = useTranslations("games.minecraft.schematicCompat.diff");
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<Record<string, GroupAction>>({});

  const diff = useToolStore((s) => s.diff);
  const targetBlockIds = useToolStore((s) => s.targetBlockIds);
  const setResolution = useToolStore((s) => s.setResolution);

  const targetSet = useMemo(() => new Set(targetBlockIds), [targetBlockIds]);

  // Collect unresolved blocks (missing + mod-only, excluding ones already resolved)
  const resolutions = useToolStore((s) => s.resolutions);
  const groups: NsGroup[] = useMemo(() => {
    if (!diff) return [];
    const byNs = new Map<string, DiffEntry[]>();
    for (const entry of diff.entries) {
      if (entry.status !== "missing" && entry.status !== "mod-only") continue;
      if (resolutions[entry.block.id]) continue; // already resolved
      const ns = entry.block.namespace;
      const list = byNs.get(ns) ?? [];
      list.push(entry);
      byNs.set(ns, list);
    }
    return [...byNs.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([namespace, entries]) => ({ namespace, entries }));
  }, [diff, resolutions]);

  const unresolvedCount = groups.reduce((s, g) => s + g.entries.length, 0);

  /** Count how many blocks in a group would be resolved by the chosen action. */
  function previewCount(group: NsGroup, action: GroupAction): number {
    if (action === "skip") return 0;
    if (action === "air") return group.entries.length;
    // remap
    return group.entries.filter((e) => remapSuffix(e.block.id, targetSet) !== null).length;
  }

  function setAction(ns: string, action: GroupAction) {
    setActions((prev) => ({ ...prev, [ns]: action }));
  }

  function handleApply() {
    for (const group of groups) {
      const action = actions[group.namespace] ?? "skip";
      if (action === "skip") continue;

      for (const entry of group.entries) {
        if (action === "air") {
          setResolution(entry.block, "minecraft:air");
        } else {
          // remap
          const target = remapSuffix(entry.block.id, targetSet);
          if (target) setResolution(entry.block, target);
        }
      }
    }
    setOpen(false);
    setActions({});
  }

  if (!diff || unresolvedCount === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Layers className="h-3.5 w-3.5" />
          {t("bulkRules")}
          <span className="rounded-full bg-layer-3/60 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
            {unresolvedCount}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-96 flex-col gap-0 p-0">
        <SheetHeader className="border-b border-edge/40 px-5 py-4">
          <SheetTitle className="text-sm font-semibold">{t("bulkRulesTitle")}</SheetTitle>
          <p className="text-xs text-ink-dim">{t("bulkRulesDesc")}</p>
        </SheetHeader>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => {
            const action = actions[group.namespace] ?? "skip";
            const preview = previewCount(group, action);
            const remapCount = group.entries.filter(
              (e) => remapSuffix(e.block.id, targetSet) !== null
            ).length;

            return (
              <div
                key={group.namespace}
                className="border-b border-edge/30 px-5 py-3 last:border-0"
              >
                {/* Header row */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink">
                      {group.namespace}
                    </span>
                    <span className="rounded-full bg-layer-3/60 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                      {group.entries.length}
                    </span>
                  </div>
                  {action !== "skip" && preview > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("bulkWouldResolve", { count: preview })}
                    </span>
                  )}
                </div>

                {/* Action radio-style buttons */}
                <div className="flex gap-2">
                  {(["skip", "remap", "air"] as GroupAction[]).map((opt) => {
                    const disabled = opt === "remap" && remapCount === 0;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={disabled}
                        onClick={() => setAction(group.namespace, opt)}
                        className={[
                          "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                          action === opt
                            ? "border-accent/60 bg-accent/10 text-accent"
                            : "border-edge/50 bg-transparent text-ink-muted hover:bg-layer-2/50",
                          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                        ].join(" ")}
                      >
                        {t(`bulkAction.${opt}`)}
                        {opt === "remap" && remapCount > 0 && (
                          <span className="ml-1 opacity-70">({remapCount})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-edge/40 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("bulkCancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={Object.values(actions).every((a) => a === "skip")}
          >
            {t("bulkApply")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
