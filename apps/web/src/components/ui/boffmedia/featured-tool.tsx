"use client"

import * as React from "react"
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
    <div className={cn("reveal", className)}>
      <Card className={cn("grid grid-cols-[1.3fr_1fr] max-[620px]:grid-cols-1 overflow-hidden mb-12")}>
        <div className="p-8 flex flex-col gap-[1.1rem]">
          <div className="flex items-center gap-4">
            <IconBox icon={tool.icon} size="lg" tone="orange" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-t-3xl">{tool.title}</h2>
                {tool.isNew && <Badge kind="new">Nuevo</Badge>}
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-t-xs tracking-widest uppercase text-[var(--accent-bright)] mt-1">
                <Icon name="sparkles" size={13} /> Herramienta destacada
              </span>
            </div>
          </div>
          <p className="text-t-base leading-relaxed m-0 text-[var(--text-muted)]">{tool.desc}</p>
          <div className="flex flex-wrap gap-2">
            {tool.features.map((f) => (
              <Badge key={f} kind="accent">{f}</Badge>
            ))}
          </div>
          <Button
            variant="primary"
            size="lg"
            iconRight="arrow"
            onClick={() => go(tool.href.replace(/^#/, ""))}
          >
            Abrir {tool.title}
          </Button>
        </div>
        <div className="relative min-h-[280px] max-[620px]:min-h-[200px]">
          <div className="w-full h-full rounded-none border-0 border-l-[var(--hairline)] border-dashed border-l-[var(--border-strong)] bg-[color:var(--surface-3)] bg-[image:repeating-linear-gradient(45deg,var(--border)_0_1px,transparent_1px_11px)] grid place-items-center overflow-hidden max-[620px]:border-l-0 max-[620px]:border-t-[var(--hairline)] max-[620px]:border-t-dashed max-[620px]:border-t-[var(--border-strong)]">
            <span className="font-mono text-t-xs text-[var(--text-dim)] tracking-[0.04em]">{tool.image}</span>
          </div>
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 font-mono text-t-xs px-3 py-1.5 rounded-full bg-black/60 text-white backdrop-blur-md">
            <Icon name="clock" size={13} /> Recién actualizado
          </span>
        </div>
      </Card>
    </div>
  )
}
