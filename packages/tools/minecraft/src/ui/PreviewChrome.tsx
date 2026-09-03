"use client"

import type { ReactNode } from "react"
import { cn } from "@boffmedia/ui/cn"

export interface PreviewButtonProps {
  on?: boolean
  onClick: () => void
  disabled?: boolean
  title?: string
  children: ReactNode
}

/** Toolbar button for the preview header — flat until toggled on. */
export function PreviewButton({ on, onClick, disabled, title, children }: PreviewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 py-[0.3125rem] px-[0.5625rem] border border-solid border-transparent bg-transparent",
        "font-mono text-[0.6875rem] cursor-pointer transition-colors duration-[140ms] disabled:opacity-40",
        on ? "text-accent-bright bg-accent-soft border-accent-line" : "text-txt-dim hover:text-txt-muted",
      )}
    >
      {children}
    </button>
  )
}

export interface SwitchSegmentProps {
  active: boolean
  disabled?: boolean
  title?: string
  onClick: () => void
  children: ReactNode
}

/** One segment of a small segmented switch (preview mode, navigation mode). */
export function SwitchSegment({ active, disabled, title, onClick, children }: SwitchSegmentProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        "py-1 px-2 font-mono text-[0.6875rem] cursor-pointer transition-colors duration-[140ms]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active ? "bg-accent-soft text-accent-bright" : "text-txt-dim hover:text-txt",
      )}
    >
      {children}
    </button>
  )
}

export function SwitchGroup({ children }: { children: ReactNode }) {
  return <div className="inline-flex items-center gap-0.5 p-0.5 border border-line bg-base">{children}</div>
}
