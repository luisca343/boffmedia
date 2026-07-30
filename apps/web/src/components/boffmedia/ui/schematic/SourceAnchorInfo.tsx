"use client"

import { useCallback, useEffect, useState } from "react"
import { Icon } from "@/components/boffmedia/primitives"
import { PreviewButton } from "./PreviewChrome"

export interface SourceAnchorInfoLabels {
  /** Section heading, e.g. "Origen en el mundo". */
  title: string
  /** Row label for the min-corner world coords. */
  origin: string
  /** Row label for where the player stood when copying. */
  playerStand: string
  /** Copy-button title. */
  copyTp: string
  /** Confirmation shown right after copying. */
  copied: string
  /** Toggle for the 3D pin + north arrow. */
  showMarker: string
}

export interface SourceAnchorInfoProps {
  labels: SourceAnchorInfoLabels
  origin?: { x: number; y: number; z: number }
  playerPos?: { x: number; y: number; z: number }
  /** Current state of the 3D marker; omit both to hide the toggle. */
  showMarker?: boolean
  onShowMarkerChange?: (v: boolean) => void
  className?: string
}

// Block coords are plain integers with no locale grouping in Minecraft (1234,
// never 1.234), so useFormat() would actively make these wrong.
function coords(v: { x: number; y: number; z: number }) {
  return `${Math.round(v.x)} ${Math.round(v.y)} ${Math.round(v.z)}`
}

/**
 * Where a schematic was copied from: the min corner's world coords and the
 * position the player stood at, plus a `/tp` shortcut so the user can stand in
 * the same spot before pasting. Presentational — every string arrives as a prop.
 */
export function SourceAnchorInfo({
  labels,
  origin,
  playerPos,
  showMarker,
  onShowMarkerChange,
  className,
}: SourceAnchorInfoProps) {
  const [copied, setCopied] = useState(false)
  const target = playerPos ?? origin

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const handleCopy = useCallback(() => {
    if (!target) return
    void navigator.clipboard?.writeText(`/tp ${coords(target)}`).then(() => setCopied(true))
  }, [target])

  if (!origin && !playerPos) return null

  return (
    <div className={`grid gap-1 border border-line bg-panel py-1.5 px-2 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-txt-muted">
          {labels.title}
        </span>
        <div className="flex-1" />
        {onShowMarkerChange && (
          <PreviewButton
            on={showMarker}
            onClick={() => onShowMarkerChange(!showMarker)}
            title={labels.showMarker}
          >
            <Icon name="eye" size={12} />
          </PreviewButton>
        )}
        {target && (
          <PreviewButton onClick={handleCopy} title={labels.copyTp}>
            <Icon name="copy" size={12} />
            {copied ? labels.copied : labels.copyTp}
          </PreviewButton>
        )}
      </div>
      {origin && (
        <div className="flex items-baseline gap-2 font-mono text-[11px]">
          <span className="text-[10px] text-txt-muted">{labels.origin}</span>
          <span className="tabular-nums text-txt-dim">{coords(origin)}</span>
        </div>
      )}
      {playerPos && (
        <div className="flex items-baseline gap-2 font-mono text-[11px]">
          <span className="text-[10px] text-txt-muted">{labels.playerStand}</span>
          <span className="tabular-nums text-txt-dim">{coords(playerPos)}</span>
        </div>
      )}
    </div>
  )
}
