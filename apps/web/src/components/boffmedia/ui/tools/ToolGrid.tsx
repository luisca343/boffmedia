import * as React from "react"
import { cn } from "@/lib/utils"
import { ToolCard } from "./ToolCard"
import type { ToolCardData } from "./tools-data"

/**
 * Responsive card grid shared by the hub and the category landings. `variant`
 * switches the card skin (and column sizing) — «fila» compact rows (default) or
 * «señal» rich cards. Mirrors `.tx-grid[data-cardvariant]` from tools.css.
 */
export function ToolGrid({ tools, variant = "fila" }: { tools: ToolCardData[]; variant?: "senal" | "fila" }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", variant === "fila" ? "sm:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]" : "sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]")}>
      {tools.map((t) => (
        <ToolCard key={t.href} tool={t} variant={variant} />
      ))}
    </div>
  )
}
