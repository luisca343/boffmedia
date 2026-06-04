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
  if (!active) return <Icon name="chevron" size={11} className="text-[color:var(--text-dim)] opacity-40" />
  return <Icon name="chevron" size={11} style={{ transform: dir === "asc" ? "rotate(180deg)" : "none" }} />
}

export function ToolTable({ columns, sortKey, sortDir, onSort, minWidth, children }: ToolTableProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
      <table className="w-full border-collapse text-sm" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr className="[&_th]:text-left [&_th]:font-mono [&_th]:text-xs [&_th]:tracking-[0.06em] [&_th]:uppercase [&_th]:text-[color:var(--text-dim)] [&_th]:py-[0.7rem] [&_th]:px-4 [&_th]:bg-[var(--surface-2)] [&_th]:border-b [&_th]:border-[var(--border-strong)]">
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.w, textAlign: c.align || "left" }}
                className={cn(c.sortable && "cursor-pointer select-none hover:text-[color:var(--text)]")}
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
