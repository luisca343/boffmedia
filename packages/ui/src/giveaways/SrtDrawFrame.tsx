"use client"

import * as React from "react"
import { cn } from "@boffmedia/ui"

export interface SrtDrawFrameProps {
  /** Wraps the stage body in the same broadcast panel every mode uses. */
  children: React.ReactNode
  /** Landed runs get the accent bloom; previews and live spins do not. */
  landed?: boolean
  /**
   * `panel` (default) wraps the body in the broadcast chassis (cut-corner panel + signal bar).
   * `inset` renders the body bare for hosts that already provide the broadcast surface.
   */
  variant?: "panel" | "inset"
  className?: string
  bodyClassName?: string
}

/**
 * The broadcast chassis shared by every draw mode AND by the setup previews —
 * cut-corner panel + accent signal bar. In `panel` mode, renders the full chassis.
 * In `inset` mode, renders the body bare for hosts that already provide the surface.
 */
export function SrtDrawFrame({ children, landed, variant = "panel", className, bodyClassName }: SrtDrawFrameProps) {
  if (variant === "inset") {
    return <div className={cn(bodyClassName, className)}>{children}</div>
  }

  return (
    <div
      className={cn(
        "cut-corner cut-corner-edge [--cut-lg:14px] border border-line bg-panel transition-all duration-500",
        className,
      )}
      style={{
        boxShadow: landed
          ? "0 8px 40px rgba(0,0,0,0.5), 0 0 60px color-mix(in srgb, var(--accent) 16%, transparent)"
          : "0 8px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div className="h-[3px] bg-gradient-to-r from-accent-bright to-accent" />
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  )
}
