import type { CompatDiff, UnifiedBlock } from "../../engine/types";
import type { SliceSet } from "../../engine/state";

export type PreviewMode = "source" | "result" | "converted";

export interface ResolutionChoice {
  targetId: string;
  applyToAll: boolean;
}

/**
 * Everything that only exists because this tool *converts* between two
 * environments. A read-only viewer has none of it, which is why it stays in the
 * tool rather than `lib/schematic/state`.
 */
export interface ConversionSlice {
  /** Analysis result. */
  diff?: CompatDiff;
  /** Per-block replacement choices, applied on export. */
  resolutions: Record<string, ResolutionChoice>;
  /** Block ids of the target registry, for the replacement comboboxes. */
  targetBlockIds: string[];
  isAnalyzing: boolean;
  isExporting: boolean;
  /**
   * Result-mode only: hide "safe" (unchanged) blocks so the converted/resolved
   * blocks stand out — lets you eyeball conversion progress.
   */
  hideUnchanged: boolean;
  /**
   * "source"   → the schematic exactly as it looks in the source game.
   * "result"   → the converted build, no overlays.
   * "converted"→ changed blocks rendered with their target texture + highlighted,
   *              unchanged blocks ghosted so the conversion result stands out.
   */
  previewMode: PreviewMode;

  setDiff: (d: CompatDiff | undefined) => void;
  setResolution: (block: UnifiedBlock, targetId: string) => void;
  clearResolution: (blockId: string) => void;
  clearResolutions: () => void;
  setTargetBlockIds: (ids: string[]) => void;
  setAnalyzing: (v: boolean) => void;
  setExporting: (v: boolean) => void;
  setHideUnchanged: (v: boolean) => void;
  setPreviewMode: (m: PreviewMode) => void;
  resetConversion: () => void;
}

const CONVERSION_DEFAULTS = {
  diff: undefined,
  resolutions: {} as Record<string, ResolutionChoice>,
  targetBlockIds: [] as string[],
  isAnalyzing: false,
  isExporting: false,
  hideUnchanged: false,
  previewMode: "source" as PreviewMode,
};

export function createConversionSlice(set: SliceSet<ConversionSlice>): ConversionSlice {
  return {
    ...CONVERSION_DEFAULTS,
    setDiff: (d) => set({ diff: d }),
    setResolution: (block, targetId) =>
      set((state) => ({
        resolutions: { ...state.resolutions, [block.id]: { targetId, applyToAll: true } },
      })),
    clearResolution: (blockId) =>
      set((state) => {
        const next = { ...state.resolutions };
        delete next[blockId];
        return { resolutions: next };
      }),
    clearResolutions: () => set({ resolutions: {} }),
    setTargetBlockIds: (ids) => set({ targetBlockIds: ids }),
    setAnalyzing: (v) => set({ isAnalyzing: v }),
    setExporting: (v) => set({ isExporting: v }),
    setHideUnchanged: (v) => set({ hideUnchanged: v }),
    setPreviewMode: (m) => set({ previewMode: m }),
    resetConversion: () => set({ ...CONVERSION_DEFAULTS }),
  };
}
