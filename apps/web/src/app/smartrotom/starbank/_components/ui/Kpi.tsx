import * as React from "react";
import { cn } from "@/lib/utils";
import { Ico, type IconName } from "./icons";

type Tone = "brand" | "pos" | "neg" | "warn";

const ICON_TONE: Record<Tone, string> = {
  brand: "bg-sb-50 text-sb-700",
  pos: "bg-sb-pos-soft text-sb-pos",
  neg: "bg-sb-neg-soft text-sb-neg",
  warn: "bg-sb-warn-soft text-sb-warn",
};

export function Kpi({ label, value, sub, delta, icon = "card", tone = "brand" }: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: number | null;
  icon?: IconName;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-sb-lg border border-sb-border bg-sb-surface p-5 shadow-sb-1">
      <div className="flex items-center justify-between text-[0.75rem] text-sb-fg-muted">
        <span>{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-[10px]", ICON_TONE[tone])}>
          <Ico name={icon} size={16} />
        </span>
      </div>
      <div className="font-sb-display text-[1.625rem] font-semibold tracking-[-0.01em] tabular-nums">{value}</div>
      {(delta != null || sub) && (
        <div className="flex items-center gap-1.5 text-[0.75rem] text-sb-fg-muted">
          {delta != null && (
            <span className={cn("font-semibold", delta > 0 ? "text-sb-pos" : "text-sb-neg")}>
              {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sub ? <span className="text-sb-fg-muted">{sub}</span> : null}
        </div>
      )}
    </div>
  );
}
