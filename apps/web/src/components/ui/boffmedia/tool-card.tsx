"use client"

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
  const disabled = tool.soon

  return (
    <Card
      hover={!disabled}
      className={cn(
        "reveal",
        disabled && "opacity-60",
        !disabled && "cursor-pointer",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={() => !disabled && go(tool.href.replace(/^#/, ""))}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !disabled) go(tool.href.replace(/^#/, ""))
      }}
    >
      <div className="p-5 flex flex-col gap-3.5">
        {/* Head */}
        <div className="flex items-start gap-3.5">
          <IconBox icon={tool.icon} size="md" tone="orange" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-t-base font-bold">{tool.title}</h3>
              {tool.isNew && <Badge kind="new">Nuevo</Badge>}
              {tool.soon && <Badge kind="soon">Pronto</Badge>}
            </div>
            <p className="text-t-sm text-[var(--text-muted,#a9abb8)] mt-1">
              {tool.desc}
            </p>
          </div>
        </div>
        {/* Features */}
        <div className="flex flex-wrap gap-1.5">
          {tool.features.map((f) => (
            <span
              key={f}
              className="text-t-xs px-2 py-0.5 rounded-[var(--radius-pill,9999px)] bg-[var(--surface-3,#1f1f30)] text-[var(--text-muted,#a9abb8)]"
            >
              {f}
            </span>
          ))}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t-[var(--hairline,1px)] border-solid border-t-[var(--border,rgba(255,255,255,0.08))]">
          {tool.popularity && (
            <span className="flex items-center gap-1.5 text-t-xs text-[var(--text-muted,#a9abb8)]">
              <Icon name="trending" size={14} />
              {tool.popularity === "high"
                ? "Popularidad alta"
                : "Popularidad media"}
            </span>
          )}
          <span className="flex items-center gap-1 text-t-xs font-semibold text-[var(--accent-bright,var(--cyan-400))] ml-auto">
            {disabled ? "Próximamente" : "Abrir"}{" "}
            <Icon name="arrow" size={14} />
          </span>
        </div>
      </div>
    </Card>
  )
}
