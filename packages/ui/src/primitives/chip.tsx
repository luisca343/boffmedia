import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

// `.cut-tag` + its `-edge` stroke, not the inline polygon this replaced: that
// polygon WAS `.cut-tag` at the default 8px, but written as a style prop it was
// invisible to the sweep that added the chamfer strokes, so every chip carried
// the corner with nothing drawing its diagonal.
const BASE = cn(
  "inline-flex items-center gap-2 whitespace-nowrap border border-solid px-3 py-[7px]",
  "font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.1em]",
  "cut-tag cut-tag-edge",
  "transition-[color,border-color,background] duration-[140ms]",
)

export interface ChipProps {
  children: React.ReactNode
  on?: boolean
  onRemove?: () => void
  onClick?: () => void
  href?: string
  className?: string
}

export function Chip({ children, on, onRemove, onClick, href, className }: ChipProps) {
  // --cut-line mirrors the border colour: `.cut-tag-edge` paints the diagonal
  // itself and cannot read a `border-*` utility.
  const tone = on
    ? "border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft text-accent"
    : "border-line-2 [--cut-line:var(--line-2)] text-txt-muted"

  if (onRemove) {
    return (
      <span className={cn(BASE, "pr-[7px]", tone, className)}>
        {children}
        <button
          type="button"
          aria-label={`Quitar ${typeof children === "string" ? children : "filtro"}`}
          onClick={onRemove}
          className="grid place-items-center w-[18px] h-[18px] ml-[2px] p-0 border-0 bg-transparent text-inherit opacity-55 cursor-pointer transition-opacity duration-[140ms] hover:opacity-100"
        >
          <Icon name="x" size={11} />
        </button>
      </span>
    )
  }

  const interactive = "hover:text-txt hover:border-line-2 hover:bg-panel-2 cursor-pointer"

  if (href) {
    return (
      <a href={href} onClick={onClick} className={cn(BASE, tone, !on && interactive, className)}>
        {children}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(BASE, tone, !on && interactive, className)}>
        {children}
      </button>
    )
  }
  return (
    <span className={cn(BASE, tone, className)}>
      {children}
    </span>
  )
}
