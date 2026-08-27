import * as React from "react"
import { cn } from "../cn"
import { ToolCard } from "./ToolCard"
import type { ToolCardData, ToolCardLabels } from "./hue"

export interface ToolGridProps {
  tools: ToolCardData[]
  /** Switches the card skin AND the column sizing — the two travel together:
   *  a compact row needs more width to stay one line, a rich card less. */
  variant?: "senal" | "fila"
  labels?: ToolCardLabels
  onSelect?: (tool: ToolCardData) => void
  className?: string
}

/** Responsive card grid for a tools listing. */
export function ToolGrid({ tools, variant = "fila", labels, onSelect, className }: ToolGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        variant === "fila"
          ? "sm:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]"
          : "sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]",
        className,
      )}
    >
      {tools.map((tool) => (
        <ToolCard key={tool.key} tool={tool} variant={variant} labels={labels} onSelect={onSelect} />
      ))}
    </div>
  )
}
