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
        "inline-flex items-center gap-[0.45rem] whitespace-nowrap shrink-0",
        "px-[0.7rem] py-[0.46rem]",
        "rounded-[var(--radius)] [border-width:var(--hairline)] border-solid [border-color:var(--border-strong)]",
        "bg-[var(--surface-2)] text-sm font-medium text-[var(--text)]",
        "hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border-strong))]",
        "transition-[border-color,background] duration-[var(--dur)] ease-[var(--ease)]",
      )}
      style={minWidth ? { minWidth } : { width }}
    >
      {icon && <Icon name={icon} size={13} className="shrink-0 text-[var(--text-dim)]" />}
      <span className="flex-1 text-left overflow-hidden text-ellipsis">{current ? current.label : placeholder}</span>
      <Icon name="chevron" size={14} className="shrink-0 text-[var(--text-dim)] ml-auto" />
    </button>
  )
}
