"use client"

import * as React from "react"
import { cn } from "../cn"
import { getLink } from "../i18n"
import { Badge } from "../primitives/badge"
import { Icon } from "../primitives/icon"
import { hueStyle, type ToolCardData, type ToolCardLabels } from "./hue"

// bottom-right diagonal cut (señal) / bottom-left (fila) — one-off clips. The
// `-edge` classes redraw the diagonal the clip erases; --cut-line tracks the
// border colour, hover included.
const SENAL_CLIP = "cut-tag cut-tag-edge [--cut-tag:14px]"
const FILA_CLIP = "cut-bl cut-edge-bl [--cut-e:10px]"
const CARD_HOVER_LINE = "hover:[--cut-line:color-mix(in_srgb,var(--ghue)_45%,var(--line))]"

const ICON_BOX =
  "cut-seal cut-seal-edge [--cut:7px] [--cut-line:color-mix(in_srgb,var(--ghue)_45%,var(--line-2))] grid flex-none place-items-center border border-solid text-[var(--ghue)] border-[color-mix(in_srgb,var(--ghue)_45%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_10%,transparent)] transition-[background,border-color] duration-[140ms] group-hover:bg-[color-mix(in_srgb,var(--ghue)_18%,transparent)] group-hover:border-[color-mix(in_srgb,var(--ghue)_65%,var(--line-2))] group-hover:[--cut-line:color-mix(in_srgb,var(--ghue)_65%,var(--line-2))]"

const SHELL_BASE =
  "group relative border border-solid border-line bg-panel text-left no-underline transition-[border-color,background,transform,box-shadow] duration-[140ms]"
const SHELL_INTERACTIVE =
  "hover:-translate-y-[3px] hover:bg-panel-2 hover:border-[color-mix(in_srgb,var(--ghue)_45%,var(--line))] hover:shadow-[0_16px_34px_rgba(0,0,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color-mix(in_srgb,var(--ghue)_75%,var(--text))]"

export interface ToolCardProps {
  tool: ToolCardData
  /** «señal» (default) is the rich vertical card; «fila» the compact row. */
  variant?: "senal" | "fila"
  labels?: ToolCardLabels
  /**
   * State-navigation hosts (the launcher) pass this and the card renders as a
   * `<button>`; URL hosts leave it unset and the card renders as the host's
   * `Link` around `tool.href`. One card, both navigation models — rather than
   * a second component that would drift in every detail but the anchor.
   */
  onSelect?: (tool: ToolCardData) => void
  className?: string
}

/**
 * Tool card — one component, two skins. «señal» (rich vertical card with head
 * icon · category · badges · arrow) and «fila» (compact horizontal row).
 */
export function ToolCard({ tool, variant = "senal", labels, onSelect, className }: ToolCardProps) {
  const soon = !!tool.soon
  const inert = soon || (!onSelect && !tool.href)

  const badges = (
    <>
      {tool.isNew && !soon && labels?.isNew && <Badge tone="new">{labels.isNew}</Badge>}
      {soon && labels?.soon && <Badge>{labels.soon}</Badge>}
    </>
  )

  const body =
    variant === "fila" ? (
      <>
        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--ghue)]" />
        <span className={cn(ICON_BOX, "h-11 w-11")}>
          <Icon name={tool.icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[18px] font-bold uppercase leading-[1.02] tracking-[0.02em]">
            {tool.title}
          </span>
          {/* No `block` here: `line-clamp-1` needs `display:-webkit-box`, and a
              display utility beside it silently wins on stylesheet order — the
              row then grows to four lines and every card in the grid stretches
              with it. */}
          <span className="mt-1 line-clamp-1 text-[13.5px] leading-[1.5] text-txt-muted">{tool.desc}</span>
        </span>
        <span className="ml-auto flex flex-none items-center gap-2">
          {badges}
          {tool.popularity === "high" && !soon && labels?.popular && (
            <span className="inline-flex items-center text-accent" title={labels.popular}>
              <Icon name="trending" size={12} />
            </span>
          )}
          <span className="text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright">
            <Icon name="arrow" size={18} />
          </span>
        </span>
      </>
    ) : (
      <>
        {/* top rail in the game hue — extends to full width on hover */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-0 h-[3px] w-[38px] bg-[var(--ghue)] transition-[width] duration-[320ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
            !inert && "group-hover:w-full",
          )}
        />
        <span className="mb-4 flex items-center gap-[11px]">
          <span
            className={cn(
              ICON_BOX,
              "h-[38px] w-[38px]",
              soon && "border-line-2 bg-transparent text-txt-dim [--cut-line:var(--line-2)]",
            )}
          >
            <Icon name={tool.icon} size={20} />
          </span>
          {tool.cat && (
            <span className="min-w-0 truncate font-mono text-[10px]/[1.3] font-semibold uppercase tracking-[0.12em] text-txt-dim">
              {tool.cat}
            </span>
          )}
          <span className="ml-auto flex flex-none gap-1.5">{badges}</span>
          {!inert && (
            <span className="ml-1.5 flex-none text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright">
              <Icon name="arrow" size={18} />
            </span>
          )}
        </span>
        <span
          className={cn(
            "block font-display text-[22px] font-bold uppercase leading-[1.02] tracking-[0.02em]",
            soon && "text-txt-muted",
          )}
        >
          {tool.title}
        </span>
        <span className="mb-0.5 mt-2 block text-pretty text-[13.5px] leading-[1.5] text-txt-muted">{tool.desc}</span>
      </>
    )

  const shell = cn(
    SHELL_BASE,
    variant === "fila"
      ? cn("flex w-full items-center gap-[15px] px-[18px] py-[15px]", FILA_CLIP)
      : cn("flex h-full flex-col px-5 pb-[18px] pt-5", SENAL_CLIP),
    inert ? "cursor-default" : cn(CARD_HOVER_LINE, SHELL_INTERACTIVE),
    className,
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => !soon && onSelect(tool)}
        disabled={soon}
        aria-label={tool.title}
        style={hueStyle(tool.hueColor)}
        className={shell}
      >
        {body}
      </button>
    )
  }

  const Link = getLink()
  return (
    <Link
      href={soon ? "#" : (tool.href ?? "#")}
      aria-label={tool.title}
      aria-disabled={inert || undefined}
      style={hueStyle(tool.hueColor)}
      className={shell}
    >
      {body}
    </Link>
  )
}
