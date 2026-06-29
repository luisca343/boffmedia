"use client";

import { useTranslations } from "next-intl";
import type { DiffEntry, DiffSummary } from "../../_lib/types";

export type StatusFilter = DiffEntry["status"] | null;

interface DiffSummaryBarProps {
  summary: DiffSummary;
  active: StatusFilter;
  onToggle: (status: DiffEntry["status"]) => void;
}

interface Chip {
  status: DiffEntry["status"];
  icon: string;
  label: string;
  count: number;
  text: string;
  ring: string;
}

export function DiffSummaryBar({ summary, active, onToggle }: DiffSummaryBarProps) {
  const t = useTranslations("games.minecraft.schematicCompat.diff");

  const chips: Chip[] = [
    { status: "safe", icon: "✅", label: t("safe"), count: summary.safe, text: "text-success", ring: "ring-success/60" },
    { status: "renamed", icon: "🔁", label: t("renamed"), count: summary.renamed, text: "text-warning", ring: "ring-warning/60" },
    { status: "state-changed", icon: "⚙️", label: t("stateChanged"), count: summary.stateChanged, text: "text-warning", ring: "ring-warning/60" },
    { status: "missing", icon: "❌", label: t("missing"), count: summary.missing, text: "text-danger", ring: "ring-danger/60" },
    { status: "mod-only", icon: "🔧", label: t("modOnly"), count: summary.modOnly, text: "text-ink-muted", ring: "ring-ink-muted/50" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => {
        const isActive = active === c.status;
        const dimmed = active !== null && !isActive;
        return (
          <button
            key={c.status}
            type="button"
            onClick={() => onToggle(c.status)}
            disabled={c.count === 0}
            title={c.label}
            className={`flex items-center gap-1.5 rounded-md border border-edge/50 bg-layer-2/40 px-2.5 py-1 text-xs transition-all hover:bg-layer-3/60 disabled:cursor-default disabled:opacity-40 ${
              isActive ? `ring-2 ${c.ring} bg-layer-3/60` : ""
            } ${dimmed ? "opacity-50" : ""}`}
          >
            <span>{c.icon}</span>
            <span className={`font-semibold ${c.text}`}>{c.count}</span>
            <span className="text-ink-dim">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
