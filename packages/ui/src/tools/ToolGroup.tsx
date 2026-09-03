import * as React from "react"
import { cn } from "../cn"
import { GameLogo } from "./GameLogo"
import { ToolGrid } from "./ToolGrid"
import type { ToolCardLabels, ToolGroupData } from "./hue"

export interface ToolGroupHeadProps {
  name: React.ReactNode
  tagline?: React.ReactNode
  hueColor: string
  logoLabel?: string
  imageSrc?: string
  /** Art slot for a host with its own image pipeline — see `GameLogo`. */
  logoArt?: React.ReactNode
  /** Mono count, right-aligned. */
  count?: React.ReactNode
  /** Trailing controls (the web's "view game" link). */
  actions?: React.ReactNode
  /**
   * Dashed rule filling the gap between the title block and the trailing items.
   *
   * On by default because it is the house pattern (`TxSection` draws the same
   * thread) and it gives the eye somewhere to travel across a wide, sparse row.
   * A head that ends in a BUTTON turns it off: a dashed line running into a
   * solid control reads as a broken border rather than a thread.
   */
  thread?: boolean
  className?: string
}

/** A game's heading row: seal · name · tagline · thread · count · actions. */
export function ToolGroupHead({
  name,
  tagline,
  hueColor,
  logoLabel,
  imageSrc,
  logoArt,
  count,
  actions,
  thread = true,
  className,
}: ToolGroupHeadProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-center gap-[1.125rem]", className)}>
      <GameLogo label={logoLabel ?? ""} hueColor={hueColor} imageSrc={imageSrc} art={logoArt} />
      <div className={cn("min-w-0", thread ? "flex-none" : "flex-1")}>
        <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-extrabold italic uppercase leading-[0.92]">
          {name}
        </h2>
        {tagline && <p className="mt-[0.3125rem] text-[0.9375rem] text-txt-muted">{tagline}</p>}
      </div>
      {thread && <span aria-hidden="true" className="min-w-0 flex-1 border-t border-dashed border-line" />}
      {count != null && <span className="mono-label flex-none max-sm:hidden">{count}</span>}
      {actions}
    </div>
  )
}

export interface ToolGroupProps {
  group: ToolGroupData
  variant?: "senal" | "fila"
  labels?: ToolCardLabels
  count?: React.ReactNode
  actions?: React.ReactNode
  thread?: boolean
  onSelect?: (tool: ToolGroupData["tools"][number]) => void
  className?: string
}

/** One game's block: its heading row over its grid. */
export function ToolGroup({
  group,
  variant = "senal",
  labels,
  count,
  actions,
  thread,
  onSelect,
  className,
}: ToolGroupProps) {
  return (
    <section className={className}>
      <ToolGroupHead
        name={group.name}
        tagline={group.tagline}
        hueColor={group.hueColor}
        logoLabel={group.logoLabel}
        imageSrc={group.imageSrc}
        count={count}
        actions={actions}
        thread={thread}
      />
      <ToolGrid tools={group.tools} variant={variant} labels={labels} onSelect={onSelect} />
    </section>
  )
}
