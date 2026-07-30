import type { SliceSet } from "@/lib/schematic/state";
import type { SchStatus } from "../_components/ui/sch-tokens";

/**
 * DiffPanel's own UI filter state (search query, "show safe" toggle, status
 * chip). Kept as its OWN slice — not `conversion.slice.ts`, which owns
 * `resolutions` — so it survives DiffPanel unmounting under the E-front
 * tabbed WorkbenchLayout (RF-12) without entangling with conversion data.
 */
export interface DiffUiSlice {
  query: string;
  showSafe: boolean;
  filter: SchStatus | null;

  setQuery: (q: string) => void;
  setShowSafe: (v: boolean) => void;
  setFilter: (f: SchStatus | null) => void;
  resetDiffUi: () => void;
}

const DIFF_UI_DEFAULTS = {
  query: "",
  showSafe: false,
  filter: null as SchStatus | null,
};

export function createDiffUiSlice(set: SliceSet<DiffUiSlice>): DiffUiSlice {
  return {
    ...DIFF_UI_DEFAULTS,
    setQuery: (q) => set({ query: q }),
    setShowSafe: (v) => set({ showSafe: v }),
    setFilter: (f) => set({ filter: f }),
    resetDiffUi: () => set({ ...DIFF_UI_DEFAULTS }),
  };
}
