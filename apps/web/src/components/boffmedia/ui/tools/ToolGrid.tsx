import * as React from "react"
import { ToolCard } from "./ToolCard"
import type { ToolCardData } from "./tools-data"

/** Responsive card grid shared by the hub and the category landings. */
export function ToolGrid({ tools }: { tools: ToolCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]">
      {tools.map((t) => (
        <ToolCard key={t.href} tool={t} />
      ))}
    </div>
  )
}
