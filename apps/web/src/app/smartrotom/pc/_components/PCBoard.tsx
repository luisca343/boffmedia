"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useBoxGrid, useMarks, useMons } from "../_hooks/queries"
import { useDragLayer } from "../_hooks/useDrag"
import { locId, usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { POKEMON_PER_BOX } from "../_utils/constants"
import { filterMons, hasAnyFilter, sortMons } from "../_utils/filters"
import { BoxGrid, type GridCell } from "./BoxGrid"
import { BoxPanel } from "./BoxPanel"
import { EmptyResults } from "./EmptyResults"
import { HoverCard } from "./HoverCard"
import { ResultsHeader } from "./ResultsHeader"
import { ThemePicker } from "./ThemePicker"
import { Panel, toast } from "./ui"

export interface PCBoardProps {
  /** The page owns the filter drawer and the share sheet. */
  onOpenFilters?: () => void
  onShareBox?: (box: number) => void
}

interface HoverState {
  mon: Mon
  rect: DOMRect
}

/**
 * The stage. It shows exactly one of two things — the active box (or two, side by
 * side), or the results of whatever filter is on — and they deliberately share the
 * same frame: the results grid is padded back up to 30 cells so nothing reflows when
 * a filter comes and goes.
 */
export function PCBoard({ onOpenFilters, onShareBox }: PCBoardProps) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const boxes = useBoxGrid(mons)
  const { drag } = useDragLayer()
  const { data: marksData } = useMarks()
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)

  const activeBox = usePcUi((s) => s.activeBox)
  const secondaryBox = usePcUi((s) => s.secondaryBox)
  const dualMode = usePcUi((s) => s.dualMode)
  const filters = usePcUi((s) => s.filters)
  const search = usePcUi((s) => s.search)
  const sort = usePcUi((s) => s.sort)
  const activeView = usePcUi((s) => s.activeView)
  const multiMode = usePcUi((s) => s.multiMode)
  const selected = usePcUi((s) => s.selected)
  const setMultiMode = usePcUi((s) => s.setMultiMode)
  const setSelected = usePcUi((s) => s.setSelected)
  const clearFilters = usePcUi((s) => s.clearFilters)

  const [hover, setHover] = useState<HoverState | null>(null)
  const [themeBox, setThemeBox] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  const dragging = !!drag?.active
  const filtering = hasAnyFilter(filters, search)

  useEffect(() => {
    setPage(0)
  }, [filters, search, sort, activeView])

  // The card is a peek, not a second cursor: it goes away the moment a drag starts.
  useEffect(() => {
    if (dragging) setHover(null)
  }, [dragging])

  const onHover = useCallback(
    (mon: Mon | null, el: HTMLElement | null) => {
      if (dragging || !mon || !el) {
        setHover(null)
        return
      }
      setHover({ mon, rect: el.getBoundingClientRect() })
    },
    [dragging],
  )

  const marks = useMemo(() => marksData ?? {}, [marksData])

  const results = useMemo(
    () =>
      filtering
        ? sortMons(filterMons(mons, filters, search, { speciesByDex, marks }), sort)
        : [],
    [filtering, mons, filters, search, sort, speciesByDex, marks],
  )

  const pages = Math.max(1, Math.ceil(results.length / POKEMON_PER_BOX))
  const current = Math.min(page, pages - 1)

  const cells: GridCell[] = useMemo(() => {
    const slice = results.slice(current * POKEMON_PER_BOX, current * POKEMON_PER_BOX + POKEMON_PER_BOX)
    const out: GridCell[] = slice.map((m) => ({ mon: m, loc: m.loc }))
    // Pad back up to a full box so the results grid is the exact same frame.
    while (out.length > 0 && out.length < POKEMON_PER_BOX) out.push({ mon: null, loc: null })
    return out
  }, [results, current])

  const resultIds = useMemo(() => results.map((m) => locId(m.loc)), [results])
  const allSelected =
    multiMode && resultIds.length > 0 && resultIds.every((id) => selected.has(id))

  const selectAll = () => {
    if (allSelected) {
      setSelected([])
      return
    }
    // `setMultiMode` clears the selection, so it has to land first.
    setMultiMode(true)
    setSelected(resultIds)
    toast(`${resultIds.length} ${t("bulk.selected", { count: resultIds.length })}`, "info")
  }

  const showDual = dualMode && secondaryBox != null && secondaryBox !== activeBox

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {filtering ? (
        <Panel className="relative flex flex-1 flex-col overflow-hidden">
          <ResultsHeader
            title={activeView?.name ?? t("empty.noResults")}
            count={results.length}
            page={current + 1}
            pages={pages}
            onPrev={() => setPage((current - 1 + pages) % pages)}
            onNext={() => setPage((current + 1) % pages)}
            onSelectAll={selectAll}
            allSelected={allSelected}
            onFilters={onOpenFilters}
            onClear={clearFilters}
          />
          <div className="flex flex-1 items-center justify-center overflow-auto p-[clamp(0.75rem,1.7vw,1.25rem)]">
            {results.length === 0 ? (
              <EmptyResults onClear={clearFilters} />
            ) : (
              <div className="w-full max-w-[41.25rem]">
                {/* Results are a view onto the collection, not a place: you cannot drop into one. */}
                <BoxGrid cells={cells} droppable={false} onHover={onHover} />
              </div>
            )}
          </div>
        </Panel>
      ) : (
        <div className="flex min-h-0 flex-1 gap-3">
          <BoxPanel
            box={activeBox}
            contents={boxes[activeBox] ?? []}
            onTheme={setThemeBox}
            onShare={onShareBox}
            onHover={onHover}
          />
          {showDual && (
            <BoxPanel
              box={secondaryBox}
              contents={boxes[secondaryBox] ?? []}
              secondary
              onTheme={setThemeBox}
              onShare={onShareBox}
              onHover={onHover}
            />
          )}
        </div>
      )}

      {hover && !multiMode && !dragging && <HoverCard mon={hover.mon} rect={hover.rect} />}
      {themeBox != null && <ThemePicker box={themeBox} onClose={() => setThemeBox(null)} />}
    </div>
  )
}
