"use client"

import { STATUS_LABELS } from "./bs-data"

interface BSStatusChipProps {
  status?: string | null
}

const STYLES: Record<string, string> = {
  brn: "var(--st-brn)", par: "var(--st-par)", psn: "var(--st-psn)",
  tox: "var(--st-tox)", slp: "var(--st-slp)", frz: "var(--st-frz)",
}

export function BSStatusChip({ status }: BSStatusChipProps) {
  if (!status) return null
  const bg = STYLES[status] || "var(--text-dim)"
  const isFnt = status === "fnt"
  return (
    <span
      className="font-mono font-bold text-[.56rem] tracking-[.1em] uppercase px-[.45em] py-[.2em] rounded-[4px] leading-none"
      style={{
        color: isFnt ? "var(--text)" : "#06070b",
        background: bg,
      }}
    >
      {STATUS_LABELS[status] || status.toUpperCase()}
    </span>
  )
}
