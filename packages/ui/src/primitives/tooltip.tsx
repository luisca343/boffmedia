import * as React from "react"
import { cn } from "../cn"

export type TooltipSide = "top" | "bottom" | "left" | "right"

const SIDE: Record<TooltipSide, string> = {
  top: "bottom-[calc(100%_+_8px)] left-1/2 -translate-x-1/2 translate-y-[3px] group-hover:translate-y-0 group-focus-within:translate-y-0",
  bottom:
    "top-[calc(100%_+_8px)] left-1/2 -translate-x-1/2 -translate-y-[3px] group-hover:translate-y-0 group-focus-within:translate-y-0",
  right:
    "left-[calc(100%_+_8px)] top-1/2 -translate-y-1/2 -translate-x-[3px] group-hover:translate-x-0 group-focus-within:translate-x-0",
  left: "right-[calc(100%_+_8px)] top-1/2 -translate-y-1/2 translate-x-[3px] group-hover:translate-x-0 group-focus-within:translate-x-0",
}

export interface TooltipProps {
  label: React.ReactNode
  side?: TooltipSide
  children: React.ReactNode
  className?: string
}

export function Tooltip({ label, side = "top", children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "absolute z-[90] whitespace-nowrap pointer-events-none",
          "font-mono text-[11px] font-semibold leading-none tracking-[0.06em] text-txt",
          "bg-base-deep border border-solid border-line-2 py-2 px-[11px]",
          "cut-tag cut-tag-edge [--cut-tag:7px] [--cut-line:var(--line-2)]",
          "opacity-0 invisible transition-[opacity,transform,visibility] duration-[160ms]",
          "group-hover:opacity-100 group-hover:visible group-hover:[transition-delay:250ms]",
          "group-focus-within:opacity-100 group-focus-within:visible group-focus-within:[transition-delay:250ms]",
          SIDE[side],
        )}
      >
        {label}
      </span>
    </span>
  )
}
