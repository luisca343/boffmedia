"use client"

export interface AxisSliderProps {
  axis?: string
  value: number
  max: number
  onChange: (value: number) => void
}

// Labelled axis slider for cropping the view by layer (Y by default). Shows the
// current value over the max in mono. Generic across any schematic axis.
export function AxisSlider({ axis = "Y", value, max, onChange }: AxisSliderProps) {
  return (
    <div className="shrink-0 flex items-center gap-[0.6rem] py-[0.55rem] px-[0.85rem] border-t border-edge">
      <span className="font-mono text-[11px] font-bold text-ink-muted w-[0.8rem] text-center shrink-0">{axis}</span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 cursor-pointer [accent-color:var(--accent)]"
      />
      <span className="font-mono text-[11px] text-ink-muted w-[3.4rem] text-right tabular-nums shrink-0">
        {value}/{max}
      </span>
    </div>
  )
}
