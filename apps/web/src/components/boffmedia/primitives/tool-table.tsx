import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface Column {
  key: string
  label: string
  w?: number | string
  align?: "left" | "center" | "right"
  sortable?: boolean
}

interface ToolTableProps {
  columns: Column[]
  sortKey?: string
  sortDir?: "asc" | "desc"
  onSort?: (key: string) => void
  minWidth?: string
  children?: React.ReactNode
}

function SortIcon({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
  if (!active) return <Icon name="chevron" size={11} className="text-[var(--text-dim)] opacity-50" />
  return <Icon name="chevron" size={11} className="text-[var(--accent-bright)]" style={{ transform: dir === "asc" ? "rotate(180deg)" : "none" }} />
}

export function ToolTable({ columns, sortKey, sortDir, onSort, minWidth, children }: ToolTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="w-full border-collapse text-sm" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr className="[&_th]:text-left [&_th]:font-mono [&_th]:text-[10px] [&_th]:tracking-[0.1em] [&_th]:uppercase [&_th]:text-[var(--text-muted)] [&_th]:font-bold [&_th]:py-[0.6rem] [&_th]:px-[0.8rem] [&_th]:sticky [&_th]:top-0 [&_th]:z-[5] [&_th]:bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] [&_th]:backdrop-blur-[6px] [&_th]:border-b-[var(--hairline)] [&_th]:border-b-solid [&_th]:border-b-[var(--border)]">
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.w, textAlign: c.align || "left" }}
                className={cn(c.sortable && "cursor-pointer select-none hover:text-[var(--text)]")}
                onClick={c.sortable && onSort ? () => onSort(c.key) : undefined}
              >
                <span
                  className="inline-flex items-center gap-1"
                  style={{ justifyContent: c.align === "right" ? "flex-end" : "flex-start" }}
                >
                  {c.label}
                  {c.sortable && <SortIcon active={sortKey === c.key} dir={sortDir} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  )
}
