"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "../primitives/boffmedia/icon"
import { BoffBadge as Badge } from "../primitives/boffmedia/badge"
import { IconBox } from "../primitives/boffmedia/icon-box"
import { BoffCard as Card } from "../primitives/boffmedia/card"

interface ToolData {
  title: string
  desc: string
  icon: string
  features: string[]
  href: string
  popularity?: string
  soon?: boolean
  isNew?: boolean
}

interface ToolCardProps {
  tool: ToolData
  go: (path: string) => void
  delay?: number
  className?: string
}

export function ToolCard({ tool, go, delay = 0, className }: ToolCardProps) {
  const [hovered, setHovered] = React.useState(false)
  const disabled = tool.soon

  return (
    <div
      className={cn("reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Card
        className={cn(
          "p-6 flex flex-col gap-[1.1rem] group h-full",
          disabled ? "opacity-70 cursor-default" : "cursor-pointer",
        )}
        style={{
          ...(hovered ? {
            transform: "translateY(-4px)",
            boxShadow: "var(--card-shadow-hover)",
          } : {}),
          borderColor: hovered
            ? "color-mix(in srgb, var(--orange-500) 50%, var(--border))"
            : "var(--border)",
        } as React.CSSProperties}
        onClick={() => !disabled && go(tool.href.replace(/^#/, ""))}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) go(tool.href.replace(/^#/, ""))
        }}
      >
        <div className="flex gap-4">
          <IconBox icon={tool.icon} size="md" tone="orange" className="shadow-[0_0_24px_-10px_var(--orange-500)]" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h3 className="text-t-lg">{tool.title}</h3>
              {tool.isNew && <Badge kind="new">Nuevo</Badge>}
              {tool.soon && <Badge kind="soon">Pronto</Badge>}
            </div>
            <p className="text-t-sm leading-relaxed m-0 text-[var(--text-muted)]">{tool.desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tool.features.map((f) => (
            <span key={f} className="inline-flex items-center text-t-xs font-medium text-[var(--text-muted)] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-t-[var(--border)]">
          {tool.popularity && (
            <span className="inline-flex items-center gap-[0.4rem] text-t-xs text-[var(--text-dim)]">
              <Icon name="trending" size={14} />{" "}
              {tool.popularity === "high"
                ? "Popularidad alta"
                : "Popularidad media"}
            </span>
          )}
          <span className="inline-flex items-center text-t-sm font-semibold text-orange-500 transition-[gap] duration-[var(--dur)] group-hover:gap-[0.65rem]">
            {disabled ? "Próximamente" : "Abrir"} <Icon name="arrow" size={15} />
          </span>
        </div>
      </Card>
    </div>
  )
}
