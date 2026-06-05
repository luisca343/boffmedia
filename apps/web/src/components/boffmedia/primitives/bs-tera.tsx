"use client"

import { tyVar } from "./bs-data"

interface BSTeraProps {
  type: string
  size?: string
}

export function BSTera({ type, size }: BSTeraProps) {
  const c = tyVar(type)
  return (
    <span
      className="inline-grid place-items-center shrink-0"
      style={{
        width: "1.3em", height: "1.3em", fontSize: size || "1em",
        clipPath: "polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)",
        background: c,
        boxShadow: `0 0 10px -1px ${c}`,
      }}
    />
  )
}
