import type {
  BlockPositionGroup,
  LittleTilesGroup,
  LittleTilesStructure,
  SchematicSummary,
} from "../types";
import type { NavMode, SliceSet } from "./types";

/** Everything the 3D view reads: instance data, selection, slicing, navigation. */
export interface ViewerSlice {
  blockPositions: BlockPositionGroup[];
  /** LittleTiles micro-boxes of the loaded document; empty when it has none. */
  littleTileGroups: LittleTilesGroup[];
  /** LittleTiles structure instances of the loaded document; empty when it has none. */
  littleTileStructures: LittleTilesStructure[];
  isFetchingPositions: boolean;
  selectedBlockId?: string;
  /**
   * Indexes into {@link littleTileStructures} the 3D view highlights. Mutually
   * exclusive with {@link selectedBlockId}: setting either clears the other,
   * so the scene never has to arbitrate two competing highlights.
   */
  selectedStructureIdx: number[] | null;
  layerY: number;
  navMode: NavMode;
  /** RF-05: dims every non-selected block group to the existing ghost look. */
  isolate: boolean;
  /**
   * RF-01/02/03: the {@link FocusRequest} the renderer flies to — index into the
   * active selection's combined instance list, plus a nonce that bumps on every
   * locate/next/prev so re-requesting the same placement (wrap-around) still
   * re-triggers the fly-to animation.
   */
  focusIndex: number | null;
  focusNonce: number;
  setBlockPositions: (groups: BlockPositionGroup[]) => void;
  setLittleTileGroups: (groups: LittleTilesGroup[]) => void;
  setLittleTileStructures: (structures: LittleTilesStructure[]) => void;
  setFetchingPositions: (v: boolean) => void;
  setSelectedBlock: (id: string | undefined) => void;
  setSelectedStructureIdx: (idx: number[] | null) => void;
  setLayerY: (y: number) => void;
  setNavMode: (m: NavMode) => void;
  setIsolate: (v: boolean) => void;
  /** Bumps `focusNonce` so the same index re-flies; pass null to clear (no re-fly). */
  setFocus: (index: number | null) => void;
  /**
   * Re-arm the viewer for a freshly loaded document: drop the previous
   * document's instance data and selection, and park the Y-slider at the top.
   * Leaves `isFetchingPositions` true because a position fetch always follows a
   * document load — the fetch hook is what clears it, including on the no-api
   * path, so the view never flashes an "empty" state between the two.
   */
  resetViewerFor: (schematic: SchematicSummary | undefined) => void;
  resetViewer: () => void;
}

const VIEWER_DEFAULTS = {
  blockPositions: [] as BlockPositionGroup[],
  littleTileGroups: [] as LittleTilesGroup[],
  littleTileStructures: [] as LittleTilesStructure[],
  isFetchingPositions: false,
  selectedBlockId: undefined,
  selectedStructureIdx: null,
  layerY: 0,
  navMode: "orbit" as NavMode,
  isolate: false,
  focusIndex: null as number | null,
  focusNonce: 0,
};

export function createViewerSlice(set: SliceSet<ViewerSlice>): ViewerSlice {
  return {
    ...VIEWER_DEFAULTS,
    setBlockPositions: (groups) => set({ blockPositions: groups }),
    setLittleTileGroups: (groups) => set({ littleTileGroups: groups }),
    setLittleTileStructures: (structures) =>
      set({ littleTileStructures: structures, selectedStructureIdx: null }),
    setFetchingPositions: (v) => set({ isFetchingPositions: v }),
    // RF-07: clearing/replacing a selection also drops isolate and any pending
    // focus request — same slice, same write, no separate cascade location.
    setSelectedBlock: (id) =>
      set({ selectedBlockId: id, selectedStructureIdx: null, isolate: false, focusIndex: null }),
    setSelectedStructureIdx: (idx) =>
      set({ selectedStructureIdx: idx, selectedBlockId: undefined, isolate: false, focusIndex: null }),
    setLayerY: (y) => set({ layerY: y }),
    setNavMode: (m) => set({ navMode: m }),
    setIsolate: (v) => set({ isolate: v }),
    setFocus: (index) =>
      set((s) => ({
        focusIndex: index,
        // Bump even on a same-index re-request — that repeat is exactly what
        // RF-03's wrap-around locate needs to re-trigger the fly-to animation.
        focusNonce: index === null ? s.focusNonce : s.focusNonce + 1,
      })),
    resetViewerFor: (schematic) =>
      set({
        blockPositions: [],
        littleTileGroups: [],
        littleTileStructures: [],
        selectedBlockId: undefined,
        selectedStructureIdx: null,
        layerY: schematic ? schematic.dimensions.y - 1 : 0,
        isFetchingPositions: !!schematic,
        isolate: false,
        focusIndex: null,
        focusNonce: 0,
      }),
    resetViewer: () => set({ ...VIEWER_DEFAULTS }),
  };
}
