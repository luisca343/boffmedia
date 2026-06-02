"use client"

import { cn } from "@/lib/utils"
import { Icon } from "../primitives/boffmedia/icon"
import { BoffBadge as Badge } from "../primitives/boffmedia/badge"
import { BoffButton as Button } from "../primitives/boffmedia/button"
import { IconBox } from "../primitives/boffmedia/icon-box"
import { BoffCard as Card } from "../primitives/boffmedia/card"

interface FeaturedToolData {
  title: string
  isNew?: boolean
  desc: string
  features: string[]
  href: string
  icon: string
  image: string
}

interface FeaturedToolProps {
  tool: FeaturedToolData
  go: (path: string) => void
  className?: string
}

export function FeaturedTool({ tool, go, className }: FeaturedToolProps) {
  return (
    <Card className={cn("reveal overflow-hidden", className)}>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-6 flex flex-col gap-4">
          {/* Top */}
          <div className="flex items-start gap-4">
            <IconBox icon={tool.icon} size="lg" tone="orange" />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-t-2xl font-bold">{tool.title}</h2>
                {tool.isNew && <Badge kind="new">Nuevo</Badge>}
              </div>
              <span className="flex items-center gap-1.5 text-t-xs text-[var(--accent-bright,var(--cyan-400))] mt-1">
                <Icon name="sparkles" size={13} />
                Herramienta destacada
              </span>
            </div>
          </div>
          {/* Description */}
          <p className="text-t-sm text-[var(--text-muted,#a9abb8)]">
            {tool.desc}
          </p>
          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {tool.features.map((f) => (
              <Badge key={f} kind="accent">
                {f}
              </Badge>
            ))}
          </div>
          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            iconRight="arrow"
            onClick={() => go(tool.href.replace(/^#/, ""))}
          >
            Abrir {tool.title}
          </Button>
        </div>
        {/* Art placeholder */}
        <div className="hidden lg:flex items-center justify-center w-[280px] bg-[var(--surface-2,#181826)] border-l-[var(--hairline,1px)] border-solid border-l-[var(--border,rgba(255,255,255,0.08))] p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-t-sm text-[var(--text-dim,#71737f)]">
              {tool.image}
            </span>
            <span className="flex items-center gap-1.5 text-t-xs text-[var(--text-muted,#a9abb8)]">
              <Icon name="clock" size={13} />
              Recién actualizado
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
