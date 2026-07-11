import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"

// contextual note (info | warn).
export function Callout({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  const warn = tone === "warn"
  return (
    <div
      className={cn(
        "cut-tag [--cut-tag:8px] flex items-start gap-[10px] border border-solid px-3 py-[10px] font-body text-[12px]/[1.5] text-txt-muted",
        warn
          ? "border-[color-mix(in_srgb,var(--warn)_35%,transparent)] bg-warn-soft"
          : "border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-signal-soft",
      )}
    >
      <Icon name={warn ? "alert" : "info"} size={15} className={cn("mt-px flex-none", warn ? "text-warn" : "text-signal")} />
      <span>{children}</span>
    </div>
  )
}
