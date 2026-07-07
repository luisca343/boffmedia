import { cn } from "@/lib/utils"
import { typeColor } from "./theme"

// Type label in its canonical colour.
export function TypeBadge({ type, small }: { type: string; small?: boolean }) {
  return (
    <span
      className={cn(
        "cut [--cut:3px] inline-flex items-center font-mono font-bold uppercase tracking-[0.08em] text-white",
        small ? "text-[9px]/none px-1.5 py-[3px]" : "text-[10px]/none px-2 py-1",
      )}
      style={{ background: typeColor(type), textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
    >
      {type}
    </span>
  )
}
