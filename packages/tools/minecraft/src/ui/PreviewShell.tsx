"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Icon } from "@boffmedia/ui"
import type { NavMode } from "../engine/state"
import { AxisSlider } from "./AxisSlider"
import { PreviewButton, SwitchGroup, SwitchSegment } from "./PreviewChrome"

/** Every string the shell renders — supplied by the consuming tool. */
export interface PreviewShellLabels {
  title: string
  fullscreen: string
  exitFullscreen: string
  navOrbit: string
  navFly: string
  navOrbitHint?: string
  navFlyHint?: string
}

export interface PreviewShellProps {
  labels: PreviewShellLabels
  /** Header controls between the title and the right-hand tools. */
  headerLead?: ReactNode
  /** Header controls just before the nav switch. */
  headerTrail?: ReactNode
  navMode: NavMode
  onNavModeChange: (m: NavMode) => void
  layerY: number
  maxLayerY: number
  onLayerYChange: (y: number) => void
  /** False disables the viewer-only controls and the layer slider. */
  hasDocument: boolean
  /** The 3D view, or the empty illustration. */
  stage: ReactNode
  caption?: ReactNode
  inspector: ReactNode
}

/**
 * Chrome around a 3D schematic view: header, stage backdrop, fullscreen, the
 * Y-layer slider and the inspector well. Knows nothing about diffs or
 * conversion — everything tool-specific arrives as a slot or a label.
 */
export function PreviewShell({
  labels,
  headerLead,
  headerTrail,
  navMode,
  onNavModeChange,
  layerY,
  maxLayerY,
  onLayerYChange,
  hasDocument,
  stage,
  caption,
  inspector,
}: PreviewShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void rootRef.current?.requestFullscreen?.()
  }, [])

  return (
    <div ref={rootRef} className="flex h-full flex-col bg-base-2">
      <div className="shrink-0 flex items-center gap-1.5 px-3 h-[2.875rem] border-b border-line">
        <span className="font-mono text-[0.65625rem] tracking-[0.14em] uppercase text-txt-muted">{labels.title}</span>
        {headerLead}
        <div className="flex-1" />
        {headerTrail}
        <SwitchGroup>
          <SwitchSegment
            active={navMode === "orbit"}
            disabled={!hasDocument}
            title={labels.navOrbitHint}
            onClick={() => onNavModeChange("orbit")}
          >
            {labels.navOrbit}
          </SwitchSegment>
          <SwitchSegment
            active={navMode === "fly"}
            disabled={!hasDocument}
            title={labels.navFlyHint}
            onClick={() => onNavModeChange("fly")}
          >
            {labels.navFly}
          </SwitchSegment>
        </SwitchGroup>
        <PreviewButton
          onClick={toggleFullscreen}
          disabled={!hasDocument}
          title={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
        >
          <Icon name={isFullscreen ? "exitFullscreen" : "fullscreen"} size={15} />
        </PreviewButton>
      </div>

      <div
        className="relative flex-1 min-h-[12.5rem] overflow-hidden"
        style={{ background: "radial-gradient(120% 120% at 50% 30%, var(--panel) 0%, var(--bg) 80%)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            opacity: 0.35,
            maskImage: "radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 85%)",
          }}
        />
        {stage}
        {caption}
      </div>

      <AxisSlider axis="Y" value={layerY} max={maxLayerY} onChange={onLayerYChange} />

      <div className="shrink-0 border-t border-line py-3 px-3 min-h-[5.75rem]">{inspector}</div>
    </div>
  )
}
