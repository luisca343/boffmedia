"use client"

import { cn } from "@/lib/utils"
import { tyVar, CAT_LABELS } from "./bs-data"

interface BSTypeProps {
  type: string
  lg?: boolean
  ghost?: boolean
}

export function BSType({ type, lg, ghost }: BSTypeProps) {
  const c = tyVar(type)
  const base = "inline-flex items-center gap-[.34em] font-mono font-bold tracking-[.1em] uppercase leading-none whitespace-nowrap"
  const sz = lg ? "text-t-2xs px-[.8em] py-[.28em]" : "text-t-3xs px-[.6em] py-[.18em]"
  return (
    <span
      className={cn(base, sz, "rounded-[var(--radius-pill)] border")}
      style={
        (ghost
          ? { color: c, "--_c": c, background: `color-mix(in srgb, ${c} 16%, transparent)`, borderColor: `color-mix(in srgb, ${c} 45%, transparent)` }
          : { color: "#06070b", "--_c": c, background: c, borderColor: `color-mix(in srgb, #fff 22%, ${c})` }) as React.CSSProperties
      }
    >
      <span className="w-[.5em] h-[.5em] rounded-full bg-current shrink-0" />
      {type}
    </span>
  )
}

export function BSTypeRow({ types, lg, ghost }: { types: string[]; lg?: boolean; ghost?: boolean }) {
  return <span className="inline-flex gap-[.3rem]">{types.map((t) => <BSType key={t} type={t} lg={lg} ghost={ghost} />)}</span>
}

interface BSCatProps {
  cat: "phys" | "spec" | "status"
}

export function BSCat({ cat }: BSCatProps) {
  const [label] = CAT_LABELS[cat] || CAT_LABELS.status
  return (
    <span className="inline-flex items-center gap-[.35em] font-mono text-t-3xs tracking-[.08em] uppercase text-ink-dim">
      <span
        className={cn(
          "w-[14px] h-[14px] rounded-[var(--radius-sm)] grid place-items-center shrink-0",
          cat === "phys" && "[background:linear-gradient(135deg,#f97316,#c2410c)]",
          cat === "spec" && "[background:linear-gradient(135deg,#4aa3e8,#0891b2)]",
          cat === "status" && "[background:linear-gradient(135deg,#9aa0ab,#57545f)]",
        )}
      />
      {label}
    </span>
  )
}
