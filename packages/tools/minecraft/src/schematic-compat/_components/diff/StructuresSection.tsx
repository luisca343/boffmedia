"use client";

import { useMemo, useState } from "react";
import { useToolT } from "../../../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon } from "@boffmedia/ui";
import { useToolStore } from "../../_store/tool.store";
import { structureSupport } from "../../../engine/loader/littletiles-support";
import type { LittleTilesStructure } from "../../../engine/types";

interface TypeGroup {
  type: string;
  /** Indexes into the store's `littleTileStructures`, in document order. */
  indexes: number[];
  instances: LittleTilesStructure[];
}

type Verdict = "converts" | "flattens-warn" | "flattens-bad";

/** An orphan instance always flattens, whatever its type's table verdict says. */
function verdictOf(type: string): Verdict {
  if (type === "unknown") return "flattens-bad";
  const support = structureSupport(type);
  if (support === "behavior") return "converts";
  return support === "flatten-unsupported" ? "flattens-warn" : "flattens-bad";
}

const BADGE_CLASS: Record<Verdict, string> = {
  converts: "bg-ok-soft text-ok border-[color-mix(in_srgb,var(--ok)_35%,transparent)]",
  "flattens-warn": "bg-warn-soft text-warn border-[color-mix(in_srgb,var(--warn)_35%,transparent)]",
  "flattens-bad": "bg-bad-soft text-bad border-[color-mix(in_srgb,var(--bad)_35%,transparent)]",
};

/**
 * LittleTiles structure instances of the loaded document, grouped by type.
 * Selecting a row highlights its geometry in the 3D preview (all instances via
 * the type row, one via an expanded instance row) — mutually exclusive with
 * block selection, which the viewer slice enforces.
 */
export function StructuresSection() {
  const t = useToolT("tools.schematicCompat.structures");
  const structures = useToolStore((s) => s.littleTileStructures);
  const selectedIdx = useToolStore((s) => s.selectedStructureIdx);
  const setSelectedIdx = useToolStore((s) => s.setSelectedStructureIdx);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const byType = new Map<string, TypeGroup>();
    structures.forEach((s, i) => {
      const g = byType.get(s.type) ?? { type: s.type, indexes: [], instances: [] };
      g.indexes.push(i);
      g.instances.push(s);
      byType.set(s.type, g);
    });
    return [...byType.values()];
  }, [structures]);

  if (structures.length === 0) return null;

  const selected = new Set(selectedIdx ?? []);

  const toggleType = (g: TypeGroup) => {
    const allSelected = g.indexes.every((i) => selected.has(i));
    const next = allSelected
      ? (selectedIdx ?? []).filter((i) => !g.indexes.includes(i))
      : [...new Set([...(selectedIdx ?? []), ...g.indexes])];
    setSelectedIdx(next.length > 0 ? next : null);
  };

  const toggleInstance = (idx: number) => {
    const next = selected.has(idx)
      ? (selectedIdx ?? []).filter((i) => i !== idx)
      : [...(selectedIdx ?? []), idx];
    setSelectedIdx(next.length > 0 ? next : null);
  };

  const badgeFor = (verdict: Verdict) => (
    <span
      title={
        verdict === "flattens-warn"
          ? t("flattensUnsupportedHint")
          : verdict === "flattens-bad"
            ? t("flattensUnknownHint")
            : undefined
      }
      className={cn(
        "shrink-0 py-[1px] px-1.5 font-mono text-[9px] font-bold tracking-[0.08em] uppercase border border-solid",
        BADGE_CLASS[verdict],
      )}
    >
      {verdict === "converts" ? t("badgeConverts") : t("badgeFlattens")}
    </span>
  );

  return (
    <section className="flex flex-col gap-[7px]">
      <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.12em] uppercase text-txt-muted">
        {t("header")}
        <span className="grid place-items-center min-w-[18px] h-4 px-1 bg-panel-2 text-txt-dim font-semibold">
          {structures.length}
        </span>
      </div>
      <div className="flex flex-col gap-[0.5rem]">
        {groups.map((g) => {
          const verdict = verdictOf(g.type);
          const allSelected = g.indexes.every((i) => selected.has(i));
          const isExpanded = !!expanded[g.type];
          return (
            <div key={g.type} className="min-w-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleType(g)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleType(g))}
                className={cn(
                  "flex items-center gap-2 p-2.5 border border-solid cursor-pointer transition-[background,border-color] duration-[140ms]",
                  allSelected
                    ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent-line)]"
                    : "border-line bg-panel hover:bg-panel-2",
                )}
              >
                <button
                  type="button"
                  aria-label={isExpanded ? t("collapse") : t("expand")}
                  aria-expanded={isExpanded}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((m) => ({ ...m, [g.type]: !m[g.type] }));
                  }}
                  className="shrink-0 grid place-items-center w-5 h-5 border-0 bg-transparent cursor-pointer text-txt-dim hover:text-txt"
                >
                  <Icon name={isExpanded ? "chevronDown" : "chevronRight"} size={14} />
                </button>
                <span className="font-mono text-[12px] text-txt truncate">{g.type}</span>
                <span className="font-mono text-[11px] text-txt-dim">
                  {t("instances", { count: g.instances.length })}
                </span>
                <span className="flex-1" />
                {badgeFor(verdict)}
              </div>
              {isExpanded ? (
                <div className="flex flex-col border border-t-0 border-solid border-line">
                  {g.indexes.map((idx, k) => {
                    const s = g.instances[k];
                    const isSel = selected.has(idx);
                    const label = s.name ?? `${s.mainPos.x}, ${s.mainPos.y}, ${s.mainPos.z}`;
                    return (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleInstance(idx)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleInstance(idx))}
                        className={cn(
                          "flex items-center gap-2 py-1.5 pl-[38px] pr-2.5 cursor-pointer transition-[background] duration-[140ms]",
                          isSel
                            ? "bg-accent-soft text-accent-bright shadow-[inset_0_0_0_1px_var(--accent-line)]"
                            : "text-txt-muted hover:bg-panel-2",
                        )}
                      >
                        <span className="font-mono text-[11px] truncate">{label}</span>
                        <span className="flex-1" />
                        <span className="font-mono text-[10.5px] text-txt-dim">
                          {t("tiles", { count: s.tileCount })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
