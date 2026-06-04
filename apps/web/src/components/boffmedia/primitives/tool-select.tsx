import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface SelectItem {
  value?: string
  label?: string
  header?: string
}

interface ToolSelectProps {
  value?: string
  items: SelectItem[]
  onSelect?: (value: string) => void
  width?: string
  align?: "left" | "right"
  icon?: string
  placeholder?: string
  minWidth?: string
}

export function ToolSelect({
  value, items, onSelect, width = "220px", icon, placeholder = "Seleccionar", minWidth,
}: ToolSelectProps) {
  const flat = items.filter((it): it is SelectItem & { value: string } => it != null && it.value != null)
  const current = flat.find((it) => String(it.value) === String(value))
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5",
        "rounded-[var(--radius)] border border-[var(--border)]",
        "bg-[var(--surface-2)] text-sm text-[color:var(--text-muted)]",
        "hover:text-[color:var(--text)] transition-colors",
      )}
      style={minWidth ? { minWidth } : { width }}
    >
      {icon && <Icon name={icon} size={13} className="shrink-0" />}
      <span className="flex-1 text-left">{current ? current.label : placeholder}</span>
      <Icon name="chevron" size={14} className="shrink-0 text-[color:var(--text-dim)]" />
    </button>
  )
}
