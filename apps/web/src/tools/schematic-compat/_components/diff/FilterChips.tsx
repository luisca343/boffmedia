"use client";

import { cn } from "@/lib/utils";
import { STATUS_META, TONE, type FilterChip, type SchStatus } from "../ui/sch-tokens";

/** Count chips that filter the diff by status. */
export function FilterChips({
  chips,
  active,
  onToggle,
}: {
  chips: FilterChip[];
  active: SchStatus | null;
  onToggle: (key: SchStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[7px]" role="group">
      {chips.map((c) => {
        const on = active === c.key;
        const dim = active !== null && !on;
        const tone = TONE[STATUS_META[c.key].tone];
        return (
          <button
            key={c.key}
            type="button"
            title={c.label}
            disabled={c.count === 0}
            aria-pressed={on}
            onClick={() => onToggle(c.key)}
            className={cn(
              "flex items-center gap-[7px] py-[5px] px-2.5 bg-panel border border-solid text-[12px] cursor-pointer",
              "transition-[opacity,border-color,background] duration-[140ms] disabled:opacity-[0.32] disabled:cursor-default",
              on ? cn(tone.bd, tone.soft) : "border-line enabled:hover:border-line-2",
              dim && "opacity-[0.42]",
            )}
          >
            <span className={cn("w-[7px] h-[7px] shrink-0", tone.dot)} />
            <span className={cn("font-mono text-[12px] font-bold tabular-nums", tone.fg)}>{c.count}</span>
            <span className={on ? "text-txt" : "text-txt-dim"}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
