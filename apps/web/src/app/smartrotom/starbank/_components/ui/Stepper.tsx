import * as React from "react";
import { cn } from "@/lib/utils";
import { Ico } from "./icons";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="my-2 mb-[22px] flex items-center gap-3">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={cn("h-0.5 flex-1 rounded-full", done || active ? "bg-sb-300" : "bg-sb-border")} />}
            <div className={cn("flex items-center gap-2.5", active ? "text-sb-fg" : "text-sb-fg-muted")}>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[13px] font-semibold",
                  done ? "bg-sb-pos text-white" : active ? "bg-sb-600 text-white" : "bg-sb-surface-3 text-sb-fg-muted",
                )}
              >
                {done ? <Ico name="check" size={14} /> : i + 1}
              </span>
              <span className="text-[13px] font-medium">{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
