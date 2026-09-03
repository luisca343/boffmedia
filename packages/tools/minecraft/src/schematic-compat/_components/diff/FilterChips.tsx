"use client";

import { cn } from "@boffmedia/ui/cn";
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
    <div className="flex flex-wrap gap-[0.4375rem]" role="group">
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
              "flex items-center gap-[0.4375rem] py-[0.3125rem] px-2.5 bg-panel border border-solid text-[0.75rem] cursor-pointer",
              "transition-[opacity,border-color,background] duration-[140ms] disabled:opacity-[0.32] disabled:cursor-default",
              on ? cn(tone.bd, tone.soft) : "border-line enabled:hover:border-line-2",
              dim && "opacity-[0.42]",
            )}
          >
            <span className={cn("w-[0.4375rem] h-[0.4375rem] shrink-0", tone.dot)} />
            <span className={cn("font-mono text-[0.75rem] font-bold tabular-nums", tone.fg)}>{c.count}</span>
            <span className={on ? "text-txt" : "text-txt-dim"}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
