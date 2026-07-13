import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { TYPES, TYPE_SKIN, type Cell } from "../_utils/sudoku"

export interface SudokuGridProps {
  grid: Cell[][]
  selectedCell: [number, number] | null
  onCellClick: (row: number, col: number) => void
}

/** The 9×9 board, drawn as nine 3×3 boxes so the box borders read without extra rules. */
export function SudokuGrid({ grid, selectedCell, onCellClick }: SudokuGridProps) {
  return (
    <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-1.5">
      {[0, 1, 2].map((boxRow) => (
        <Fragment key={boxRow}>
          {[0, 1, 2].map((boxCol) => (
            <div
              key={`${boxRow}-${boxCol}`}
              className="grid grid-cols-3 gap-1 rounded-[10px] border border-white/[.07] bg-black/30 p-1"
            >
              {[0, 1, 2].map((cellRow) => (
                <Fragment key={cellRow}>
                  {[0, 1, 2].map((cellCol) => {
                    const row = boxRow * 3 + cellRow
                    const col = boxCol * 3 + cellCol
                    const cell = grid[row]?.[col]
                    const selected = selectedCell?.[0] === row && selectedCell?.[1] === col

                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        onClick={() => onCellClick(row, col)}
                        disabled={cell?.isGiven}
                        title={cell?.value || undefined}
                        aria-label={`Fila ${row + 1}, columna ${col + 1}${cell?.value ? `: ${cell.value}` : ""}`}
                        className={cn(
                          "flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border",
                          "font-ar-mono text-[8px] font-bold uppercase leading-none transition-colors sm:text-[9px]",
                          cell?.value
                            ? TYPE_SKIN[cell.value]
                            : "border-white/[.08] bg-ar-void-2/60 text-ar-ink-muted",
                          cell?.isGiven ? "cursor-not-allowed" : "hover:border-ar-cyan/60",
                          selected && "ring-2 ring-ar-magenta",
                        )}
                      >
                        {cell?.value ? (
                          <span className="truncate px-0.5">{cell.value}</span>
                        ) : (
                          <span className="grid h-full w-full grid-cols-3 gap-px p-px">
                            {TYPES.map((type) => (
                              <span
                                key={type}
                                className={cn(
                                  "flex items-center justify-center rounded-[1px] text-[0.4rem] font-bold leading-none",
                                  cell?.notes.includes(type)
                                    ? TYPE_SKIN[type]
                                    : "text-transparent",
                                )}
                              >
                                {cell?.notes.includes(type) ? type[0] : ""}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
