"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * Hand-rolled windowing for the DiffPanel status-section grids (B2). No
 * @tanstack/react-virtual / react-window / react-virtuoso / react-virtualized —
 * none is present in apps/web/package.json and none is added here
 * (no_new_dependency invariant). B4 fixes MappingCard's height so the
 * arithmetic below (uniform row height) is valid.
 */

export interface GridWindowRange {
  startRow: number;
  endRow: number;
  topPad: number;
  bottomPad: number;
}

/** Columns an auto-fill grid of `minCol`-wide tiles settles on at `width`, mirroring CSS `repeat(auto-fill, minmax(minCol, 1fr))`. */
export function columnsFor(width: number, minCol: number, gap: number): number {
  if (width <= 0 || minCol <= 0) return 1;
  return Math.max(1, Math.floor((width + gap) / (minCol + gap)));
}

/** Row range that should mount for a given scroll position, padded by `overscan` rows each side. */
export function visibleRange(scrollTop: number, viewportH: number, rowH: number, rows: number, overscan: number): GridWindowRange {
  if (rows <= 0 || rowH <= 0) {
    return { startRow: 0, endRow: -1, topPad: 0, bottomPad: 0 };
  }
  const rawStart = Math.floor(scrollTop / rowH) - overscan;
  const rawEnd = Math.floor((scrollTop + viewportH) / rowH) + overscan;
  const startRow = Math.max(0, rawStart);
  const endRow = Math.min(rows - 1, Math.max(startRow, rawEnd));
  const topPad = startRow * rowH;
  const bottomPad = Math.max(0, (rows - 1 - endRow) * rowH);
  return { startRow, endRow, topPad, bottomPad };
}

/** Row containing a flat grid index at `columns` items per row. */
export function rowOfIndex(index: number, columns: number): number {
  if (columns <= 0) return 0;
  return Math.floor(index / columns);
}

export interface UseGridWindowOptions {
  /** Total item count in this grid. */
  itemCount: number;
  /** Fixed row stride in px (card height + row gap) — exact, since B4 makes MappingCard uniform. */
  rowHeight: number;
  /** CSS auto-fill `minmax()` first argument. */
  minColWidth: number;
  gap?: number;
  overscan?: number;
}

export interface UseGridWindowResult extends GridWindowRange {
  /** Attach to the grid's own wrapper element (the padded container), not the scroll container. */
  gridRef: RefObject<HTMLDivElement | null>;
  columns: number;
  /** Scrolls the row containing `index` into view within `scrollRef`'s container (RF-10). */
  scrollToIndex: (index: number) => void;
}

const DEFAULT_GAP = 8;
const DEFAULT_OVERSCAN = 2;
// Pre-measure seed: enough rows to cover any plausible viewport at the fixed
// card height, so the first commit never mounts a thousands-card group. The
// pre-paint measure below replaces it with the real range.
const INITIAL_ROWS = 10;

/**
 * Windows a single auto-fill grid that lives inside a taller scrollable
 * container (`scrollRef`). Measures the grid's own offset within the
 * container via getBoundingClientRect diffs (not offsetTop), so it is correct
 * regardless of the container's positioning context. Renders only rows
 * [startRow, endRow] and reserves `topPad`/`bottomPad` so the scrollbar length
 * stays correct.
 */
export function useGridWindow(scrollRef: RefObject<HTMLElement | null>, options: UseGridWindowOptions): UseGridWindowResult {
  const { itemCount, rowHeight, minColWidth, gap = DEFAULT_GAP, overscan = DEFAULT_OVERSCAN } = options;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(1);
  const [range, setRange] = useState<GridWindowRange>({ startRow: 0, endRow: Math.min(itemCount, INITIAL_ROWS) - 1, topPad: 0, bottomPad: 0 });
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const colsRef = useRef(columns);
  colsRef.current = columns;

  const measure = useCallback(() => {
    const scrollEl = scrollRef.current;
    const gridEl = gridRef.current;
    if (!scrollEl || !gridEl) return;
    const cols = columnsFor(gridEl.clientWidth, minColWidth, gap);
    const rows = Math.max(1, Math.ceil(itemCount / cols));
    // Top of the grid's *border box* within the scroll container's content.
    // The padding this hook applies is inside that box, so the box top does not
    // move with it — subtracting topPad here would double-count and make each
    // pass drift further down (runaway scroll + unreachable rows).
    const contentTop = gridEl.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
    const relScrollTop = scrollEl.scrollTop - contentTop;
    const next = visibleRange(relScrollTop, scrollEl.clientHeight, rowHeight, rows, overscan);
    if (cols !== colsRef.current) {
      colsRef.current = cols;
      setColumns(cols);
    }
    const prev = rangeRef.current;
    if (
      next.startRow !== prev.startRow ||
      next.endRow !== prev.endRow ||
      next.topPad !== prev.topPad ||
      next.bottomPad !== prev.bottomPad
    ) {
      rangeRef.current = next;
      setRange(next);
    }
  }, [scrollRef, itemCount, minColWidth, gap, rowHeight, overscan]);

  // Runs after every commit: a sibling grid re-padding itself shifts this one's
  // offset without resizing it, and no scroll/resize event fires for that.
  // The equality guard above keeps this from looping.
  useLayoutEffect(() => {
    measure();
  });

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    scrollEl.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(scrollEl);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener("resize", measure);
    return () => {
      scrollEl.removeEventListener("scroll", measure);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [scrollRef, measure]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const scrollEl = scrollRef.current;
      const gridEl = gridRef.current;
      if (!scrollEl || !gridEl) return;
      const cols = columns || 1;
      const row = rowOfIndex(index, cols);
      const contentTop = gridEl.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
      const rowTop = contentTop + row * rowHeight;
      const rowBottom = rowTop + rowHeight;
      if (rowTop < scrollEl.scrollTop) {
        scrollEl.scrollTo({ top: rowTop, behavior: "smooth" });
      } else if (rowBottom > scrollEl.scrollTop + scrollEl.clientHeight) {
        scrollEl.scrollTo({ top: rowBottom - scrollEl.clientHeight, behavior: "smooth" });
      }
    },
    [scrollRef, columns, rowHeight],
  );

  return { gridRef, columns, startRow: range.startRow, endRow: range.endRow, topPad: range.topPad, bottomPad: range.bottomPad, scrollToIndex };
}
