"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffSliderProps {
  defaultValue?: number | number[]
  value?: number | number[]
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  onValueChange?: (value: number[]) => void
  unit?: string
  className?: string
}

export function BoffSlider({ defaultValue = 50, value: controlledValue, min = 0, max = 100, step = 1, onChange, onValueChange, unit = "", className }: BoffSliderProps) {
  const initialVal = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue
  const [val, setVal] = React.useState(initialVal)
  const ref = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef(false)
  const currentVal = controlledValue !== undefined ? (Array.isArray(controlledValue) ? controlledValue[0] : controlledValue) : val
  const pct = ((currentVal - min) / (max - min)) * 100
  const updateVal = (newVal: number) => { setVal(newVal); onChange && onChange(newVal); onValueChange && onValueChange([newVal]) }
  const setFrom = (cx: number) => { const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); let raw = min + ((cx - r.left) / r.width) * (max - min); raw = Math.max(min, Math.min(max, Math.round(raw / step) * step)); updateVal(raw) }

  React.useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => { if (!drag.current) return; setFrom("touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX) }
    const up = () => { drag.current = false }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up)
    window.addEventListener("touchmove", move); window.addEventListener("touchend", up)
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up) }
  }, [min, max, step])

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className={cn(
          "relative flex-1 h-1.5 rounded-[999px] bg-layer-3 cursor-pointer",
          "data-[direction=hud]:rounded-sm",
        )}
        ref={ref}
        onMouseDown={(e) => { drag.current = true; setFrom(e.clientX) }}
      >
        <span className="absolute left-0 top-0 h-full rounded-[inherit] bg-secondary" style={{ width: `${pct}%` }} />
        <span
          className={cn(
            "absolute top-1/2 w-[18px] h-[18px] rounded-full bg-white border-2 border-solid border-secondary",
            "-translate-x-1/2 -translate-y-1/2 cursor-grab",
            "shadow-[0_2px_8px_-2px_var(--shadow-color)]",
            "data-[direction=hud]:rounded-[3px]",
            "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--secondary-soft)]",
          )}
          tabIndex={0}
          role="slider"
          aria-valuenow={currentVal}
          aria-valuemin={min}
          aria-valuemax={max}
          style={{ left: `${pct}%` }}
          onMouseDown={(e) => { e.stopPropagation(); drag.current = true }}
          onKeyDown={(e) => { let d = 0; if (e.key === "ArrowRight" || e.key === "ArrowUp") d = step; if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -step; if (d) { e.preventDefault(); updateVal(Math.max(min, Math.min(max, currentVal + d))) } }}
        />
      </div>
      <span className="font-mono text-sm text-ink-muted min-w-[44px] text-right">{currentVal}{unit}</span>
    </div>
  )
}
