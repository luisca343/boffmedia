"use client"

import * as React from "react"
import { Icon } from "../primitives/icon"
import { BoffBadge as Badge } from "../primitives/badge"

interface ToolRowTool {
  icon: string
  name: string
  cat: string
  desc: string
  status: string
}

interface ToolRowProps {
  tool: ToolRowTool
  onClick: () => void
  delay?: number
}

export function ToolRow({ tool, onClick, delay = 0 }: ToolRowProps) {
  const statusKind = tool.status === "live" ? "accent" : tool.status as "accent" | "new" | "soon"
  const statusLabel = tool.status === "live" ? "Disponible" : tool.status === "new" ? "Nuevo" : "Pronto"

  return (
    <button
      className="flex flex-col gap-4 p-6 text-left cursor-pointer bg-[var(--card-bg)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--card-shadow)] transition-all duration-[var(--dur)] ease-[var(--ease)] hover:border-[color-mix(in_srgb,var(--orange-500)_50%,var(--border))] hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-[3px]"
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-[46px] h-[46px] rounded-[var(--radius)] text-[var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] border border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)] shrink-0">
          <Icon name={tool.icon} size={22} />
        </span>
        <div className="flex flex-col gap-[0.35rem] flex-1 min-w-0">
          <span className="font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-dim)]">{tool.cat}</span>
          <span className="font-display font-bold text-lg">{tool.name}</span>
          <span className="text-sm text-[var(--text-muted)] leading-[1.55]">{tool.desc}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge kind={statusKind}>{statusLabel}</Badge>
        <Icon name="arrow" size={16} className="text-[var(--text-dim)]" />
      </div>
    </button>
  )
}
