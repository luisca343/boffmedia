import { cn } from "@/lib/utils"

interface PickerProps {
  value: string
  options: (string | { value: string; label: string })[]
  onChange: (value: string) => void
  className?: string
  ariaLabel?: string
}

export function Picker({ value, options, onChange, className, ariaLabel }: PickerProps) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--border)]",
        "bg-[var(--surface-2)] text-sm text-[color:var(--text)] font-[inherit]",
        "appearance-none cursor-pointer",
        "focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]",
        className,
      )}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o
        const l = typeof o === "object" ? o.label : o
        return <option key={v} value={v}>{l}</option>
      })}
    </select>
  )
}
