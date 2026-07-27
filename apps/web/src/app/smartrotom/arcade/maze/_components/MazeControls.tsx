"use client"

import { useTranslations } from "next-intl"
import type { ChangeEvent } from "react"
import { Button, Icon, Input, Panel } from "../../_components/ui"

export interface MazeControlsProps {
  size: number
  depth: number
  showDebug: boolean
  onSizeChange: (e: ChangeEvent<HTMLInputElement>) => void
  onDepthChange: (e: ChangeEvent<HTMLInputElement>) => void
  onRegenerate: () => void
  onToggleDebug: () => void
}

/** The generator's dials. */
export function MazeControls({
  size,
  depth,
  showDebug,
  onSizeChange,
  onDepthChange,
  onRegenerate,
  onToggleDebug,
}: MazeControlsProps) {
  const t = useTranslations("arcade")
  return (
    <Panel tone="cyan" tight>
      <div className="mb-3 font-ar-display text-[9px] uppercase text-ar-cyan">{t("maze.generator")}</div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="maze-size"
            className="font-ar-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ar-ink-muted"
          >
            {t("maze.size")}
          </label>
          <Input id="maze-size" type="number" min="5" value={size} onChange={onSizeChange} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="maze-depth"
            className="font-ar-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ar-ink-muted"
          >
            {t("maze.depth")}
          </label>
          <Input id="maze-depth" type="number" min="1" value={depth} onChange={onDepthChange} />
        </div>
        <Button variant="cyan" size="sm" full icon={<Icon.Reset s={12} />} onClick={onRegenerate}>
          {t("maze.regenerate")}
        </Button>
        <Button
          variant={showDebug ? "primary" : "ghost"}
          size="sm"
          full
          icon={<Icon.Grid s={12} />}
          onClick={onToggleDebug}
          aria-pressed={showDebug}
        >
          {showDebug ? t("maze.hideDebug") : t("maze.showDebug")}
        </Button>
      </div>
    </Panel>
  )
}
