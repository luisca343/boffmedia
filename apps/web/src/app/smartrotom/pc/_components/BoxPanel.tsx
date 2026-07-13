"use client"

import { usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { boxTheme } from "../_utils/boxMeta"
import { WALLPAPER_CLASS } from "../_utils/boxThemes"
import { TOTAL_BOXES } from "../_utils/constants"
import { BoxGrid, type GridCell } from "./BoxGrid"
import { BoxHeader } from "./BoxHeader"
import { Panel } from "./ui"

export interface BoxPanelProps {
  box: number
  contents: (Mon | null)[]
  secondary?: boolean
  onTheme: (box: number) => void
  onShare?: (box: number) => void
  onHover?: (mon: Mon | null, el: HTMLElement | null) => void
}

/**
 * The stage: one box, on its wallpaper. The grid is clamped and centred rather than
 * stretched, so a box and the results view frame identically — switching between them
 * must not resize a single slot.
 */
export function BoxPanel({ box, contents, secondary = false, onTheme, onShare, onHover }: BoxPanelProps) {
  const boxMeta = usePcUi((s) => s.boxMeta)
  const setActiveBox = usePcUi((s) => s.setActiveBox)
  const setSecondaryBox = usePcUi((s) => s.setSecondaryBox)
  const dualMode = usePcUi((s) => s.dualMode)
  const toggleDual = usePcUi((s) => s.toggleDual)

  const go = (delta: number) => {
    const next = (box + delta + TOTAL_BOXES) % TOTAL_BOXES
    if (secondary) setSecondaryBox(next)
    else setActiveBox(next)
  }

  const closeSecondary = () => {
    if (dualMode) toggleDual()
    setSecondaryBox(null)
  }

  const cells: GridCell[] = contents.map((mon, index) => ({
    mon,
    loc: { kind: "box", box, index },
  }))

  return (
    <Panel className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <span aria-hidden className={`pc-wp pc-wp-dots ${WALLPAPER_CLASS[boxTheme(boxMeta, box)]}`} />

      <div className="relative z-[1] flex h-full min-h-0 flex-col">
        <BoxHeader
          box={box}
          contents={contents}
          secondary={secondary}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onTheme={() => onTheme(box)}
          onShare={onShare}
          onClose={secondary ? closeSecondary : undefined}
        />

        <div className="flex flex-1 items-center justify-center overflow-auto p-[clamp(12px,1.7vw,20px)]">
          <div className={`w-full ${secondary ? "max-w-[540px]" : "max-w-[660px]"}`}>
            <BoxGrid cells={cells} onHover={onHover} />
          </div>
        </div>
      </div>
    </Panel>
  )
}
