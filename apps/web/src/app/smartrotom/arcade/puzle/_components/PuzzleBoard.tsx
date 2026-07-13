import { cn } from "@/lib/utils"
import { Corners } from "../../_components/ui"
import type { PuzzlePiece } from "../_hooks/useSlidingPuzzle"

export interface PuzzleBoardProps {
  pieces: PuzzlePiece[]
  columns: number
  isComplete: boolean
  onMove: (piece: PuzzlePiece) => void
}

const CELL = 100
const TILE = 98

/** The tray. Pieces are absolutely placed and slide on a CSS transform — no motion lib. */
export function PuzzleBoard({ pieces, columns, isComplete, onMove }: PuzzleBoardProps) {
  return (
    <div
      className={cn(
        "ar-scanlines relative mx-auto rounded-[14px] border bg-black/50 p-1",
        isComplete ? "border-ar-lime/60 shadow-[0_0_36px_-6px_rgb(var(--ar-lime)/.5)]" : "border-white/10",
      )}
      style={{ width: columns * CELL + 8, height: columns * CELL + 8 }}
    >
      <Corners tone={isComplete ? "lime" : "violet"} inset={4} size={12} />
      {pieces.map((piece) => (
        <button
          key={piece.id}
          type="button"
          onClick={() => onMove(piece)}
          aria-label={`Pieza ${piece.id + 1}`}
          className={cn(
            "absolute left-1 top-1 overflow-hidden rounded-[6px] border border-white/[.08]",
            "transition-transform duration-300 ease-out motion-reduce:transition-none",
            "hover:brightness-125 focus-visible:brightness-125",
          )}
          style={{
            width: TILE,
            height: TILE,
            transform: `translate(${(piece.position % columns) * CELL}px, ${Math.floor(piece.position / columns) * CELL}px)`,
          }}
        >
          {/* A tile is a canvas data URL — there is nothing for next/image to fetch or optimise. */}
          <img src={piece.src} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  )
}
