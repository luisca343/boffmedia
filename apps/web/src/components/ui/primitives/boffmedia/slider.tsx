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
    <div className={cn("k-slider", className)}>
      <div className="k-slider__track" ref={ref} onMouseDown={(e) => { drag.current = true; setFrom(e.clientX) }}>
        <span className="k-slider__fill" style={{ width: `${pct}%` }} />
        <span className="k-slider__thumb" tabIndex={0} role="slider" aria-valuenow={currentVal} aria-valuemin={min} aria-valuemax={max} style={{ left: `${pct}%` }}
          onMouseDown={(e) => { e.stopPropagation(); drag.current = true }}
          onKeyDown={(e) => { let d = 0; if (e.key === "ArrowRight" || e.key === "ArrowUp") d = step; if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -step; if (d) { e.preventDefault(); updateVal(Math.max(min, Math.min(max, currentVal + d))) } }} />
      </div>
      <span className="k-slider__val">{currentVal}{unit}</span>
    </div>
  )
}
