import * as React from "react"
import { cn } from "@/lib/utils"
import { DK_CUT } from "./utils"

export interface DkSelectOption {
  value: string | number
  label: string
}

const CARET: React.CSSProperties = {
  appearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 15px) 55%, calc(100% - 10px) 55%",
  backgroundSize: "5px 5px",
  backgroundRepeat: "no-repeat",
}

export interface DkSelectProps {
  value: string | number
  options: (DkSelectOption | string)[]
  onChange: (value: string) => void
  minWidth?: string
  ariaLabel?: string
  className?: string
}

export function DkSelect({ value, options, onChange, minWidth, ariaLabel, className }: DkSelectProps) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...CARET, minWidth }}
      className={cn("cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:8px]", "max-w-[280px] cursor-pointer text-ellipsis border border-solid border-line-2 bg-base py-[9px] pl-[11px] pr-[28px]",
        "font-mono text-[11px] font-semibold leading-[1.2] tracking-[0.04em] text-txt outline-none transition-[border-color] hover:border-line-2 focus-visible:outline-2 focus-visible:outline-accent-line",
        className,
      )}
    >
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o
        const l = typeof o === "object" ? o.label : o
        return (
          <option key={String(v)} value={v}>
            {l}
          </option>
        )
      })}
    </select>
  )
}
