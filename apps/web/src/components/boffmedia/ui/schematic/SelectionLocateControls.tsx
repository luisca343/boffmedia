"use client"

import { Icon } from "@boffmedia/ui"
import { PreviewButton } from "./PreviewChrome"

export interface SelectionLocateControlsLabels {
  /** "Locate" button title/text. */
  locate: string
  /** Previous-placement button title. */
  prev: string
  /** Next-placement button title. */
  next: string
  /** Isolate toggle title. */
  isolate: string
  /** "{index} / {navigable}" stepper text, already interpolated by the caller. */
  stepper: string
  /** RF-08 culled-interiors note ("of {total} total…"), already interpolated. Shown only when `culled`. */
  culledNote?: string
}

export interface SelectionLocateControlsProps {
  labels: SelectionLocateControlsLabels
  /** False at navigable<=1 — hides the prev/next stepper rather than showing a dead 1/1 (RF-04). */
  canCycle: boolean
  /** RF-08: the diff-reported total exceeds what the client can cycle to. */
  culled: boolean
  isolate: boolean
  onLocate: () => void
  onNext: () => void
  onPrev: () => void
  onToggleIsolate: () => void
  className?: string
}

/**
 * Locate/cycle/isolate control cluster for a selected block or LT structure:
 * a Locate button, a prev/next stepper (hidden at count<=1), an isolate
 * toggle, and the RF-08 culled-interiors note. Presentational only — every
 * bit of state and every handler arrives as a prop (see the `useSelectionFocus`
 * action hook). Pixel-identical between the compat and viewer inspectors,
 * which is why it lives here rather than in either tool's `_components/`.
 */
export function SelectionLocateControls({
  labels,
  canCycle,
  culled,
  isolate,
  onLocate,
  onNext,
  onPrev,
  onToggleIsolate,
  className,
}: SelectionLocateControlsProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-1">
        <PreviewButton onClick={onLocate} title={labels.locate}>
          <Icon name="crosshair" size={13} />
          {labels.locate}
        </PreviewButton>
        {canCycle && (
          <>
            <PreviewButton onClick={onPrev} title={labels.prev}>
              <Icon name="back" size={13} />
            </PreviewButton>
            <span className="px-1 font-mono text-[11px] tabular-nums text-txt-dim">{labels.stepper}</span>
            <PreviewButton onClick={onNext} title={labels.next}>
              <Icon name="arrow" size={13} />
            </PreviewButton>
          </>
        )}
        <PreviewButton on={isolate} onClick={onToggleIsolate} title={labels.isolate}>
          <Icon name="eye" size={13} />
        </PreviewButton>
      </div>
      {culled && labels.culledNote && <p className="m-0 text-[10.5px] text-txt-dim">{labels.culledNote}</p>}
    </div>
  )
}
