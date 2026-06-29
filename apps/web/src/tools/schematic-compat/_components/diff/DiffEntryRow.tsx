"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Combobox } from "@/components/ui/primitives/combobox";
import type { DiffEntry } from "../../_lib/types";
import { useToolStore } from "../../_store/tool.store";
import { BlockThumb } from "./BlockThumb";

interface DiffEntryRowProps {
  entry: DiffEntry;
}

const STATUS_RING: Record<DiffEntry["status"], string> = {
  safe: "ring-success/60",
  renamed: "ring-warning/60",
  "state-changed": "ring-warning/60",
  missing: "ring-danger/60",
  "mod-only": "ring-ink-muted/50",
};

const STATUS_DOT: Record<DiffEntry["status"], string> = {
  safe: "bg-success",
  renamed: "bg-warning",
  "state-changed": "bg-warning",
  missing: "bg-danger",
  "mod-only": "bg-ink-muted",
};

export function DiffEntryRow({ entry }: DiffEntryRowProps) {
  const t = useTranslations("games.minecraft.schematicCompat.diff");
  const targetBlockIds = useToolStore((s) => s.targetBlockIds);
  const sourceVersion = useToolStore((s) => s.sourceReg?.version);
  const targetVersion = useToolStore((s) => s.targetReg?.version);
  const sourceRegId = useToolStore((s) => s.sourceReg?.id);
  const targetRegId = useToolStore((s) => s.targetReg?.id);
  const resolution = useToolStore((s) => s.resolutions[entry.block.id]);
  const setResolution = useToolStore((s) => s.setResolution);
  const clearResolution = useToolStore((s) => s.clearResolution);
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const setSelectedBlock = useToolStore((s) => s.setSelectedBlock);
  const isSelected = selectedBlockId === entry.block.id;

  const options = useMemo(
    () => targetBlockIds.map((id) => ({ label: id, value: id })),
    [targetBlockIds],
  );

  const needsReplacement = entry.status === "missing" || entry.status === "mod-only";
  const stateKeys = Object.keys(entry.block.states);
  const autoTargetId = entry.autoCandidate?.id;

  const sharedInteraction = {
    "data-block-id": entry.block.id,
    role: "button" as const,
    tabIndex: 0,
    onClick: () => setSelectedBlock(isSelected ? undefined : entry.block.id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ")
        setSelectedBlock(isSelected ? undefined : entry.block.id);
    },
  };

  // ── Compact single-line layout for missing / mod-only ────────────────────
  if (needsReplacement) {
    const isMissing = entry.status === "missing";
    const idleBg = isMissing
      ? "border-danger/20 bg-danger/[0.04] hover:bg-danger/[0.08]"
      : "border-edge/40 bg-layer-2/30 hover:bg-layer-2/50";

    return (
      <div
        {...sharedInteraction}
        className={`group flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 transition-colors ${
          isSelected ? "border-accent/60 bg-accent/10 ring-1 ring-accent/30" : idleBg
        }`}
      >
        <BlockThumb
          blockId={entry.block.id}
          version={sourceVersion}
          registryId={sourceRegId}
          ringClassName={`ring-1 ${STATUS_RING[entry.status]}`}
          size={24}
        />

        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[entry.status]}`} />

        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
          {entry.block.id}
        </span>

        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums ${
            isMissing
              ? "bg-danger/10 text-danger"
              : "bg-layer-3/60 text-ink-muted"
          }`}
        >
          ×{entry.instanceCount}
        </span>

        {/* stopPropagation keeps combobox interactions from toggling selection */}
        <div
          className="w-44 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Combobox
            data={options}
            value={resolution?.targetId ?? ""}
            onChange={(value) => {
              if (value) setResolution(entry.block, value);
              else clearResolution(entry.block.id);
            }}
            placeholder={t("replaceWith")}
            variant="boff"
            className="h-7 w-full text-[11px]"
          />
        </div>

        {resolution?.targetId && (
          <BlockThumb
            blockId={resolution.targetId}
            version={targetVersion}
            registryId={targetRegId}
            size={24}
          />
        )}
      </div>
    );
  }

  // ── Verbose layout for renamed / state-changed / safe ────────────────────
  return (
    <div
      {...sharedInteraction}
      className={`group cursor-pointer rounded-md border p-2.5 transition-colors ${
        isSelected
          ? "border-accent/60 bg-accent/10 ring-1 ring-accent/30"
          : "border-edge/40 bg-layer-2/30 hover:bg-layer-2/50"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <BlockThumb
          blockId={entry.block.id}
          version={sourceVersion}
          registryId={sourceRegId}
          ringClassName={`ring-1 ${STATUS_RING[entry.status]}`}
        />

        {autoTargetId && (
          <div className="flex items-center gap-1.5 self-center text-ink-dim">
            <ArrowRight className="h-3.5 w-3.5" />
            <BlockThumb
              blockId={autoTargetId}
              version={targetVersion}
              registryId={targetRegId}
              size={28}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[entry.status]}`} />
            <span className="truncate font-mono text-xs text-ink">{entry.block.id}</span>
          </div>
          {autoTargetId && (
            <div className="truncate pl-3 font-mono text-[11px] text-success/80">
              → {autoTargetId}
            </div>
          )}
          <div className="pl-3 text-[11px] text-ink-dim">
            {t("instances", { count: entry.instanceCount })}
          </div>
          {stateKeys.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 pl-3">
              {stateKeys.map((k) => {
                const bad = entry.incompatibleStates?.includes(k);
                return (
                  <span
                    key={k}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      bad
                        ? "bg-danger/15 text-danger"
                        : "bg-layer-3/60 text-ink-muted"
                    }`}
                  >
                    {k}={entry.block.states[k]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
