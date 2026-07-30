/** @vitest-environment jsdom */
import { createElement, useRef, type ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { columnsFor, useGridWindow } from "./grid-window";

/**
 * jsdom has no layout engine, so this file *models* the one coupling that can
 * make windowing feed back on itself: the scroll container's vertical
 * scrollbar. When the stacked grids' total height exceeds the viewport the
 * scrollbar appears and every grid's clientWidth shrinks by SCROLLBAR_W, which
 * changes columnsFor() -> rows -> total height. The model resolves that the way
 * a browser does (lay out, decide the scrollbar, lay out again) and clamps
 * scrollTop to the content, so a hook that cannot converge shows up here as
 * React's own "Maximum update depth exceeded".
 */

const VIEW_H = 600;
const FULL_W = 800;
const SCROLLBAR_W = 15;
const ROW_H = 156; // MAPPING_CARD_HEIGHT (148) + GRID_GAP (8)
const GAP = 8;
const MIN_COL = 260;
const HEADER_H = 20;
let realRowH = ROW_H;
let hidden = false;

let rawScrollTop = 0;

interface Layout {
  width: number;
  total: number;
  tops: number[];
  grids: HTMLElement[];
}

function layout(): Layout {
  const grids = Array.from(document.querySelectorAll<HTMLElement>("[data-grid]"));
  let width = FULL_W;
  let total = 0;
  let tops: number[] = [];
  for (let pass = 0; pass < 3; pass++) {
    total = 0;
    tops = [];
    for (const g of grids) {
      const cols = columnsFor(width, MIN_COL, GAP);
      const items = g.children.length;
      const padT = Number.parseFloat(g.style.paddingTop) || 0;
      const padB = Number.parseFloat(g.style.paddingBottom) || 0;
      // A pinned height wins over the painted content, exactly as a
      // border-box element with `align-content: start` behaves: children that
      // paint a hair taller overflow instead of growing the box.
      const pinned = Number.parseFloat(g.style.height);
      const contentH = items > 0 ? Math.ceil(items / cols) * realRowH - GAP : 0;
      total += HEADER_H;
      tops.push(total);
      total += Number.isNaN(pinned) ? padT + padB + contentH : pinned;
    }
    const next = total > VIEW_H ? FULL_W - SCROLLBAR_W : FULL_W;
    if (next === width) break;
    width = next;
  }
  return { width, total, tops, grids };
}

function scrollTopOf(l: Layout): number {
  return Math.max(0, Math.min(rawScrollTop, l.total - VIEW_H));
}

const originals: Record<string, PropertyDescriptor | undefined> = {};

function patchMetrics() {
  for (const key of ["clientWidth", "clientHeight", "scrollTop", "scrollHeight"]) {
    originals[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
  }
  originals.getBoundingClientRect = Object.getOwnPropertyDescriptor(Element.prototype, "getBoundingClientRect");

  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      const l = layout();
      if (hidden) return 0; // display:none ancestor (the panel sits in an inactive tab)
      return this.dataset.scroll !== undefined || this.dataset.grid !== undefined ? l.width : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      if (hidden) return 0;
      return this.dataset.scroll !== undefined ? VIEW_H : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      return layout().total;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTop", {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.scroll !== undefined ? scrollTopOf(layout()) : 0;
    },
    set(v: number) {
      rawScrollTop = v;
    },
  });
  Object.defineProperty(Element.prototype, "getBoundingClientRect", {
    configurable: true,
    value(this: HTMLElement) {
      const l = layout();
      const st = scrollTopOf(l);
      let top = 0;
      let height = 0;
      if (this.dataset.scroll !== undefined) {
        height = VIEW_H;
      } else if (this.dataset.grid !== undefined) {
        const i = l.grids.indexOf(this);
        top = (i === -1 ? 0 : l.tops[i]) - st;
      }
      return { top, left: 0, right: l.width, bottom: top + height, width: l.width, height, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
    },
  });
}

function restoreMetrics() {
  for (const key of ["clientWidth", "clientHeight", "scrollTop", "scrollHeight"]) {
    const d = originals[key];
    if (d) Object.defineProperty(HTMLElement.prototype, key, d);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
  if (originals.getBoundingClientRect) {
    Object.defineProperty(Element.prototype, "getBoundingClientRect", originals.getBoundingClientRect);
  }
}

let renders = 0;
let observerCallbacks: Array<() => void> = [];
let lastScrollToIndex: ((index: number) => void) | null = null;

function Grid({ scrollRef, itemCount }: { scrollRef: React.RefObject<HTMLDivElement | null>; itemCount: number }) {
  renders++;
  const { gridRef, columns, startRow, endRow, topPad, bottomPad, reservedHeight, scrollToIndex } = useGridWindow(scrollRef, {
    itemCount,
    rowHeight: ROW_H,
    minColWidth: MIN_COL,
    gap: GAP,
  });
  lastScrollToIndex = scrollToIndex;
  const cols = columns || 1;
  const start = Math.min(startRow * cols, itemCount);
  const end = Math.min((endRow + 1) * cols, itemCount);
  const cards: ReactNode[] = [];
  for (let i = start; i < end; i++) cards.push(createElement("div", { key: i, "data-card": i }));
  return createElement(
    "section",
    null,
    createElement("div", { "data-head": true }),
    createElement("div", { ref: gridRef, "data-grid": true, style: { paddingTop: topPad, paddingBottom: bottomPad, height: reservedHeight } }, cards),
  );
}

function Panel({ counts }: { counts: number[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  return createElement(
    "div",
    { ref: listRef, "data-scroll": true },
    counts.map((n, i) => createElement(Grid, { key: i, scrollRef: listRef, itemCount: n })),
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  rawScrollTop = 0;
  realRowH = ROW_H;
  hidden = false;
  renders = 0;
  lastScrollToIndex = null;
  patchMetrics();
  observerCallbacks = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly cb: () => void) {
        observerCallbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        observerCallbacks = observerCallbacks.filter((c) => c !== this.cb);
      }
    },
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  restoreMetrics();
  vi.unstubAllGlobals();
});

function mount(counts: number[]) {
  act(() => {
    root.render(createElement(Panel, { counts }));
  });
}

/**
 * The real DiffPanel renders its scroll container while the analysis is still
 * running and only mounts the group grids once `diff` arrives, so the grids'
 * first commit already sees a non-null scrollRef. Reproduce that order.
 */
function mountLate(counts: number[]) {
  mount([]);
  act(() => {
    root.render(createElement(Panel, { counts }));
  });
}

function scrollTo(px: number) {
  const el = container.querySelector<HTMLElement>("[data-scroll]")!;
  act(() => {
    el.scrollTop = px;
    el.dispatchEvent(new Event("scroll"));
  });
}

describe("useGridWindow convergence", () => {
  it("settles on mount with several sibling grids", () => {
    mount([120, 40, 24]);
    expect(renders).toBeLessThan(30);
  });

  it("does not loop when scrolling a windowed group (scrollbar <-> column feedback)", () => {
    mountLate([2000, 40, 24]);
    const before = renders;
    for (let y = 0; y < 4000; y += 137) scrollTo(y);
    expect(renders - before).toBeLessThan(400);
  });

  it("does not loop when the real row height differs from the assumed stride", () => {
    realRowH = ROW_H + 2; // fractional browser zoom: 148px cards paint at ~150
    mountLate([2000, 40, 24]);
    const before = renders;
    for (let y = 0; y < 4000; y += 137) scrollTo(y);
    scrollTo(1e9);
    expect(renders - before).toBeLessThan(400);
  });

  it("does not loop when scrolling the user's 184-entry palette", () => {
    mountLate([120, 40, 24]);
    const before = renders;
    for (let y = 0; y < 2000; y += 53) scrollTo(y);
    expect(renders - before).toBeLessThan(400);
  });

  it("mounts a viewport-full of cards on the very first commit of a windowed group", () => {
    // Mounted together with the scroll container, i.e. the order in which the
    // parent's ref is still null when the grid's layout effect runs.
    mount([2000]);
    const rows = Math.ceil(container.querySelectorAll("[data-card]").length / 2);
    // 785px wide -> 2 columns; the 600px viewport spans 4 rows, +2 overscan
    // each side, so 6 rows minimum must be mounted.
    expect(rows).toBeGreaterThanOrEqual(6);
  });

  it("renders a small group whole, with no reserved padding", () => {
    mount([184]);
    expect(container.querySelectorAll("[data-card]").length).toBe(184);
    const grid = container.querySelector<HTMLElement>("[data-grid]")!;
    expect(grid.style.paddingTop).toBe("0px");
    expect(grid.style.paddingBottom).toBe("0px");
    expect(grid.style.height).toBe("");
  });

  it("recovers when a zero-sized (hidden tab) container becomes visible", () => {
    hidden = true;
    mount([2000]);
    const stub = container.querySelectorAll("[data-card]").length;
    hidden = false;
    act(() => {
      for (const cb of observerCallbacks) cb();
    });
    expect(container.querySelectorAll("[data-card]").length).toBeGreaterThan(stub);
  });

  it("still flies to a selected row in an unwindowed group (RF-10)", () => {
    const scrolls: number[] = [];
    mount([184]);
    const el = container.querySelector<HTMLElement>("[data-scroll]")!;
    el.scrollTo = ((opts: ScrollToOptions) => scrolls.push(opts.top ?? 0)) as typeof el.scrollTo;
    const grid = container.querySelector<HTMLElement>("[data-grid]")!;
    const { top } = grid.getBoundingClientRect();
    act(() => {
      lastScrollToIndex!(180);
    });
    // Row 90 of a 2-column grid, measured from the grid's own offset.
    expect(scrolls).toHaveLength(1);
    expect(scrolls[0]).toBeCloseTo(top + 90 * ROW_H + ROW_H - VIEW_H, 0);
  });
});
