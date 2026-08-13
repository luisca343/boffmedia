"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

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

/**
 * Rows an `itemCount`-item grid occupies at `columns` per row. Zero items means
 * zero rows: reserving a phantom row for an empty group used to make the
 * reserved height disagree with what the grid actually paints (nothing).
 */
export function rowsFor(itemCount: number, columns: number): number {
  if (itemCount <= 0 || columns <= 0) return 0;
  return Math.ceil(itemCount / columns);
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
  /**
   * Height the consumer MUST pin on the grid element while windowing, so the
   * element's box stays a function of (itemCount, columns) alone and never of
   * the mounted range — see the convergence note on `useGridWindow`.
   * `undefined` means "let the content size it" (small groups, or before the
   * first successful measure).
   */
  reservedHeight?: number;
  /** True when only a row window is mounted; false for a small group rendered whole. */
  windowed: boolean;
  /** Scrolls the row containing `index` into view within `scrollRef`'s container (RF-10). */
  scrollToIndex: (index: number) => void;
}

const DEFAULT_GAP = 8;
const DEFAULT_OVERSCAN = 2;
/**
 * Below this many cards a group is rendered whole: a few hundred MappingCards
 * is well within what the DOM handles, and rendering them all removes this
 * grid from the measure/setState feedback surface entirely. With
 * "compatible blocks" off, every group the user normally sees is under it, so
 * the default view mounts complete lists on the first paint.
 */
const UNWINDOWED_MAX = 300;
/**
 * Backstop, not the fix: how many range changes one frame may produce before we
 * stop measuring and warn. The convergence argument below is what keeps this
 * from ever being hit; the cap only guarantees a bug degrades into a stale
 * window instead of React's "Maximum update depth exceeded".
 */
const MEASURE_BUDGET = 40;

const schedule = (cb: () => void): number =>
  typeof requestAnimationFrame === "function" ? requestAnimationFrame(cb) : (setTimeout(cb, 0) as unknown as number);
const unschedule = (id: number): void => {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
  else clearTimeout(id);
};

/** Seed row count: a viewport's worth at this stride, so the pre-measure paint is never a token stub. */
function seedRows(rowHeight: number, overscan: number): number {
  const viewportH = typeof window === "undefined" ? 0 : window.innerHeight;
  return Math.max(1, Math.ceil((viewportH || 900) / Math.max(1, rowHeight)) + overscan);
}

/**
 * Windows a single auto-fill grid that lives inside a taller scrollable
 * container (`scrollRef`). Measures the grid's own offset within the
 * container via getBoundingClientRect diffs (not offsetTop), so it is correct
 * regardless of the container's positioning context. Renders only rows
 * [startRow, endRow] and reserves `topPad`/`bottomPad` so the scrollbar length
 * stays correct.
 *
 * CONVERGENCE (this is load-bearing — the hook used to crash with React's
 * "Maximum update depth exceeded" while scrolling). Every input `measure()`
 * reads must be independent of every output it writes:
 *   - height: `reservedHeight` pins the grid box at rows*rowHeight - gap. The
 *     padding-only version made the box `topPad + (real painted rows) +
 *     bottomPad`, which equals rows*rowHeight - gap ONLY if the painted stride
 *     is exactly `rowHeight`. Under fractional zoom (or any card that paints a
 *     pixel off 148) it is not, so the box grew/shrank with the mounted range,
 *     which moved the total content height, which moved the browser's scrollTop
 *     clamp near the end of the list, which moved the range — an unbounded
 *     two-state ping-pong across sibling grids.
 *   - width: the consumer keeps `scrollbar-gutter: stable` on the scroll
 *     container, so `clientWidth` (hence `columnsFor`) cannot depend on how
 *     tall the content is, killing the scrollbar-appears/disappears cycle.
 *   - offset: `contentTop` is the top of the grid's *border box* within the
 *     scroll container's content. The padding this hook applies is inside that
 *     box, so the box top does not move with it — subtracting topPad here would
 *     double-count and make each pass drift further down (runaway scroll +
 *     unreachable rows).
 */
export function useGridWindow(scrollRef: RefObject<HTMLElement | null>, options: UseGridWindowOptions): UseGridWindowResult {
  const { itemCount, rowHeight, minColWidth, gap = DEFAULT_GAP, overscan = DEFAULT_OVERSCAN } = options;
  const windowed = itemCount > UNWINDOWED_MAX;
  const gridRef = useRef<HTMLDivElement | null>(null);
  // 0 means "not measured yet": a hidden or unlaid-out container reports width
  // 0, and guessing 1 column there would both under-render and pin a wildly
  // wrong reservedHeight. Consumers read `columns || 1`.
  const [columns, setColumns] = useState(0);
  const [range, setRange] = useState<GridWindowRange>(() => {
    if (itemCount <= 0) return { startRow: 0, endRow: -1, topPad: 0, bottomPad: 0 };
    // Rows, not items. The seed cannot know the column count, so at the real
    // (>1) column count this mounts a multiple of a viewport — still bounded,
    // and the post-paint measure below replaces it immediately.
    return { startRow: 0, endRow: Math.min(itemCount - 1, seedRows(rowHeight, overscan) - 1), topPad: 0, bottomPad: 0 };
  });
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const colsRef = useRef(columns);
  colsRef.current = columns;

  const passesRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const warnedRef = useRef(false);

  const measure = useCallback(() => {
    const scrollEl = scrollRef.current;
    const gridEl = gridRef.current;
    if (!scrollEl || !gridEl) return;
    const width = gridEl.clientWidth;
    const viewportH = scrollEl.clientHeight;
    // Zero-sized means "not laid out yet" (e.g. the panel sits in a hidden
    // tab). Keep the seed and wait for the ResizeObserver to fire on the
    // hidden -> visible transition rather than committing bogus geometry.
    if (width <= 0 || viewportH <= 0) return;

    const cols = columnsFor(width, minColWidth, gap);
    if (cols !== colsRef.current) {
      colsRef.current = cols;
      setColumns(cols);
    }
    if (!windowed) return;

    const rows = rowsFor(itemCount, cols);
    const contentTop = gridEl.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
    const relScrollTop = scrollEl.scrollTop - contentTop;
    const next = visibleRange(relScrollTop, viewportH, rowHeight, rows, overscan);
    const prev = rangeRef.current;
    if (
      next.startRow !== prev.startRow ||
      next.endRow !== prev.endRow ||
      next.topPad !== prev.topPad ||
      next.bottomPad !== prev.bottomPad
    ) {
      passesRef.current += 1;
      if (frameRef.current === null) {
        frameRef.current = schedule(() => {
          frameRef.current = null;
          passesRef.current = 0;
        });
      }
      if (passesRef.current > MEASURE_BUDGET) {
        if (!warnedRef.current) {
          warnedRef.current = true;
          console.warn("[grid-window] measure did not converge within one frame; window frozen for this frame");
        }
        return;
      }
      rangeRef.current = next;
      setRange(next);
    }
  }, [scrollRef, itemCount, minColWidth, gap, rowHeight, overscan, windowed]);

  // Runs after every commit: a sibling grid re-padding itself shifts this one's
  // offset without resizing it, and no scroll/resize event fires for that.
  // The equality guard above keeps this from looping.
  useLayoutEffect(() => {
    measure();
  });

  // Subscriptions AND the first real measurement have to be passive, not
  // layout: React attaches a parent's ref after its children's layout effects
  // run, so on the grids' very first commit `scrollRef.current` is still null.
  // The layout effect above therefore no-ops on mount, and doing this
  // subscribe here (deps never change) used to bail out permanently — the grid
  // stayed frozen at its seed with no scroll/resize listener at all until some
  // unrelated re-render happened to run the layout effect again. That was the
  // "list shows too few cards until something forces a re-measure" bug.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    measure();
    scrollEl.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(scrollEl);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener("resize", measure);
    return () => {
      scrollEl.removeEventListener("scroll", measure);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      if (frameRef.current !== null) {
        unschedule(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [scrollRef, measure]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const scrollEl = scrollRef.current;
      const gridEl = gridRef.current;
      if (!scrollEl || !gridEl) return;
      // Rows are uniform whether or not this grid is windowed (an unwindowed
      // grid is just startRow 0 with no padding), so the same arithmetic flies
      // to the right row in both modes.
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

  const rows = rowsFor(itemCount, columns || 1);
  // endRow stays a ROW index in both modes; the consumer turns it into an item
  // slice with the column count.
  const effective: GridWindowRange = windowed ? range : { startRow: 0, endRow: rows - 1, topPad: 0, bottomPad: 0 };

  return {
    gridRef,
    columns,
    windowed,
    // Only pin a height once the real column count is known, and only while
    // windowing: an unwindowed grid mounts every row, so its natural height is
    // already correct and range-independent.
    reservedHeight: windowed && columns > 0 ? Math.max(0, rows * rowHeight - gap) : undefined,
    startRow: effective.startRow,
    endRow: effective.endRow,
    topPad: effective.topPad,
    bottomPad: effective.bottomPad,
    scrollToIndex,
  };
}
