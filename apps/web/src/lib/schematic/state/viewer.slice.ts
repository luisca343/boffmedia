import type { BlockPositionGroup, SchematicSummary } from "../types";
import type { NavMode, SliceSet } from "./types";

/** Everything the 3D view reads: instance data, selection, slicing, navigation. */
export interface ViewerSlice {
  blockPositions: BlockPositionGroup[];
  isFetchingPositions: boolean;
  selectedBlockId?: string;
  layerY: number;
  navMode: NavMode;
  setBlockPositions: (groups: BlockPositionGroup[]) => void;
  setFetchingPositions: (v: boolean) => void;
  setSelectedBlock: (id: string | undefined) => void;
  setLayerY: (y: number) => void;
  setNavMode: (m: NavMode) => void;
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
  isFetchingPositions: false,
  selectedBlockId: undefined,
  layerY: 0,
  navMode: "orbit" as NavMode,
};

export function createViewerSlice(set: SliceSet<ViewerSlice>): ViewerSlice {
  return {
    ...VIEWER_DEFAULTS,
    setBlockPositions: (groups) => set({ blockPositions: groups }),
    setFetchingPositions: (v) => set({ isFetchingPositions: v }),
    setSelectedBlock: (id) => set({ selectedBlockId: id }),
    setLayerY: (y) => set({ layerY: y }),
    setNavMode: (m) => set({ navMode: m }),
    resetViewerFor: (schematic) =>
      set({
        blockPositions: [],
        selectedBlockId: undefined,
        layerY: schematic ? schematic.dimensions.y - 1 : 0,
        isFetchingPositions: !!schematic,
      }),
    resetViewer: () => set({ ...VIEWER_DEFAULTS }),
  };
}
