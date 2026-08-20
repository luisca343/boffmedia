"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { Cell } from "../types"
import VoltorbImage from "./VoltorbIcon"

interface CellProps {
  cell: Cell
  onClick: () => void
  rowIndex: number
  colIndex: number
}

// The lit face, by multiplier. Full literal classes — `text-${…}` never compiles.
const FACE: Record<number, string> = {
  1: "border-white/20 bg-[radial-gradient(80%_80%_at_50%_30%,rgb(var(--ar-ink-dim)/.2),#06031a)] shadow-[inset_0_0_18px_rgb(var(--ar-ink-dim)/.13),0_2px_0_rgb(0_0_0/.4)] text-ar-ink-dim",
  2: "border-ar-cyan/35 bg-[radial-gradient(80%_80%_at_50%_30%,rgb(var(--ar-cyan)/.2),#06031a)] shadow-[inset_0_0_18px_rgb(var(--ar-cyan)/.13),0_2px_0_rgb(0_0_0/.4)] text-ar-cyan ar-glow-cyan",
  3: "border-ar-amber/35 bg-[radial-gradient(80%_80%_at_50%_30%,rgb(var(--ar-amber)/.2),#06031a)] shadow-[inset_0_0_18px_rgb(var(--ar-amber)/.13),0_2px_0_rgb(0_0_0/.4)] text-ar-amber ar-glow-amber",
}

const BOMB_FACE =
  "border-ar-magenta/45 bg-[radial-gradient(80%_80%_at_50%_30%,rgb(var(--ar-magenta)/.3),#1a0e3d)] shadow-[inset_0_0_22px_rgb(var(--ar-magenta)/.25),0_2px_0_rgb(0_0_0/.4)]"

const MARK_TONE: Record<number, string> = {
  0: "text-ar-magenta-2",
  1: "text-ar-ink-dim",
  2: "text-ar-cyan",
  3: "text-ar-amber",
}

// Memo keys, in the order they sit on the memo pad: the three multipliers, then
// the bomb (mark 0).
const MARKS = [1, 2, 3, 0]

function markList(cell: Cell) {
  return MARKS.filter((m) => cell.marks.includes(m))
    .map((m) => (m === 0 ? "voltorb" : `x${m}`))
    .join(", ")
}

/**
 * One tile of the board. Three faces — hidden (hatched, with the memo marks the
 * player wrote on it), a lit multiplier, or the Voltorb that ends the run — with
 * a CSS 3D flip between them.
 */
function CellComponent({ cell, onClick, rowIndex, colIndex }: CellProps) {
  const t = useTranslations("arcade")
  const row = rowIndex + 1
  const col = colIndex + 1
  const marks = markList(cell)

  let label: string
  if (cell.revealed) {
    label = t("voltorb.cellRevealed", {
      row,
      col,
      value: cell.value === 0 ? "Voltorb" : `x${cell.value}`,
    })
  } else if (marks) {
    label = t("voltorb.cellMarked", { row, col, marks })
  } else {
    label = t("voltorb.cellHidden", { row, col })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative aspect-square w-full select-none [perspective:600px]",
        "transition-transform duration-150 motion-reduce:transition-none",
        !cell.revealed && "hover:-translate-y-0.5 active:translate-y-px",
      )}
    >
      <span
        className={cn(
          "relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
          "motion-reduce:transition-none",
          cell.revealed && "[transform:rotateY(180deg)]",
        )}
      >
        <span
          className={cn(
            "absolute inset-0 grid place-items-center overflow-hidden rounded-[10px] border border-ar-violet/35",
            "bg-[linear-gradient(180deg,#2a165c_0%,#14082e_100%)]",
            "shadow-[inset_0_1px_0_rgb(255_255_255/.06),0_2px_0_rgb(0_0_0/.45)]",
            "[backface-visibility:hidden]",
          )}
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgb(255_255_255/.025)_0_4px,transparent_4px_8px)]"
          />
          {cell.marks.length > 0 ? (
            <span className="relative grid grid-cols-2 gap-0.5 rounded-md bg-black/40 p-1">
              {MARKS.map((mark) => (
                <span key={mark} className="grid h-[18px] w-[18px] place-items-center">
                  {cell.marks.includes(mark) &&
                    (mark === 0 ? (
                      <span
                        aria-hidden
                        className="ar-glow-magenta text-[13px] leading-none text-ar-magenta-2"
                      >
                        ⚡
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className={cn(
                          "font-ar-mono text-[11px] font-bold leading-none",
                          MARK_TONE[mark],
                        )}
                      >
                        {mark}
                      </span>
                    ))}
                </span>
              ))}
            </span>
          ) : (
            <span aria-hidden className="relative font-ar-display text-[10px] text-ar-ink-muted">
              ?
            </span>
          )}
        </span>

        <span
          className={cn(
            "absolute inset-0 grid place-items-center rounded-[10px] border",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            cell.value === 0 ? BOMB_FACE : FACE[cell.value],
          )}
        >
          {cell.value === 0 ? (
            <VoltorbImage size="lg" glow />
          ) : (
            <span aria-hidden className="font-ar-display text-[18px] sm:text-[22px]">
              {cell.value}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

export default CellComponent
