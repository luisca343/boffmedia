"use client"

import { cn } from "@boffmedia/ui/cn"

export interface AxisSliderProps {
  /** Axis letter shown at the left and used as the input's accessible name. */
  axis?: string
  value: number
  max: number
  onChange: (value: number) => void
  className?: string
}

/** Layer-crop slider for a 3D volume — a bar that sits under the stage. */
export function AxisSlider({ axis = "Y", value, max, onChange, className }: AxisSliderProps) {
  return (
    <div className={cn("shrink-0 flex items-center gap-2.5 py-[9px] px-3 border-t border-line", className)}>
      <span className="font-mono text-[11px] font-bold text-accent-bright w-3.5 text-center shrink-0">{axis}</span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={axis}
        className="flex-1 h-1 cursor-pointer [accent-color:var(--accent)]"
      />
      <span className="font-mono text-[11px] text-txt-muted w-11 text-right tabular-nums shrink-0">
        {value}/{max}
      </span>
    </div>
  )
}
