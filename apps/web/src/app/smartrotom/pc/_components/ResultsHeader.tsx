"use client"

import { Button, Icon } from "./ui"

export interface ResultsHeaderProps {
  title: string
  count: number
  page: number
  pages: number
  onPrev: () => void
  onNext: () => void
  onSelectAll: () => void
  allSelected: boolean
  /** The page owns the filter drawer. */
  onFilters?: () => void
  onClear: () => void
}

/** The stage's header while a filter or a search is narrowing the collection. */
export function ResultsHeader({
  title,
  count,
  page,
  pages,
  onPrev,
  onNext,
  onSelectAll,
  allSelected,
  onFilters,
  onClear,
}: ResultsHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 border-b border-pc-line bg-gradient-to-r from-pc-violet/10 to-transparent px-3.5 py-2.5">
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] border border-pc-violet/50 bg-gradient-to-br from-pc-violet/40 to-pc-violet/[.12] text-pc-violet">
        <Icon name="sliders" size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-pc-display text-base font-bold text-pc-fg">{title}</h3>
        <p className="font-pc-mono text-[11.5px] text-pc-fg-subtle">
          {count} Pokémon · página {page}/{pages || 1}
        </p>
      </div>

      <Button icon onClick={onPrev} disabled={pages <= 1} aria-label="Página anterior">
        <Icon name="chevL" size={16} />
      </Button>
      <Button icon onClick={onNext} disabled={pages <= 1} aria-label="Página siguiente">
        <Icon name="chevR" size={16} />
      </Button>

      {count > 0 && (
        <Button
          onClick={onSelectAll}
          title="Seleccionar todos los resultados (todas las páginas)"
          className={allSelected ? "border-pc-cyan bg-pc-cyan/[.12] text-pc-cyan" : ""}
        >
          <Icon name="check" size={14} />
          {allSelected ? "Quitar" : `Sel. ${count}`}
        </Button>
      )}

      {onFilters && (
        <Button onClick={onFilters}>
          <Icon name="sliders" size={14} />
          Filtros
        </Button>
      )}

      <Button variant="danger" onClick={onClear}>
        <Icon name="x" size={14} />
        Limpiar
      </Button>
    </div>
  )
}
