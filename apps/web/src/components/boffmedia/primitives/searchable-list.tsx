"use client"

import { cn } from "@/lib/utils"
import { SearchInput } from "./search-input"

interface SearchableListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  className?: string
  listClassName?: string
  emptyMessage?: string
  loading?: boolean
  loadingComponent?: React.ReactNode
  error?: string | null
}

export function SearchableList<T>({
  items,
  renderItem,
  search,
  onSearchChange,
  placeholder = "Buscar…",
  className,
  listClassName,
  emptyMessage = "Sin resultados",
  loading,
  loadingComponent,
  error,
}: SearchableListProps<T>) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="shrink-0 p-3 border-b border-[var(--border)]">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={placeholder}
        />
      </div>
      <div className={cn("flex-1 overflow-y-auto", listClassName)}>
        {loading && (loadingComponent || (
          <div className="py-12 flex justify-center text-[var(--text-dim)]">
            <span className="font-mono text-xs">Cargando…</span>
          </div>
        ))}
        {!loading && error && (
          <p className="py-8 px-4 text-center text-xs text-[var(--rose-500)]">{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="py-8 text-center text-xs text-[var(--text-dim)]">{emptyMessage}</p>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="p-2 flex flex-col gap-0.5">
            {items.map((item, i) => renderItem(item, i))}
          </div>
        )}
      </div>
    </div>
  )
}
