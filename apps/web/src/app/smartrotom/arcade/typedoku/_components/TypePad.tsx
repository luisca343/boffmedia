import { cn } from "@/lib/utils"
import { TYPES, TYPE_SKIN } from "../_utils/sudoku"

export interface TypePadProps {
  onSelect: (type: string) => void
  /** In notes mode a tap pencils the type in instead of committing it. */
  isNotesMode: boolean
}

/** The nine type keys. Tapping one fills the selected cell. */
export function TypePad({ onSelect, isNotesMode }: TypePadProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={cn(
            "ar-lift rounded-lg border px-3.5 py-2",
            "font-ar-mono text-[11px] font-bold uppercase tracking-[0.08em]",
            TYPE_SKIN[type],
            isNotesMode && "border-dashed",
          )}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
