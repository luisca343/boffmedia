import { create } from "zustand";
import type {
  RegistryHandle,
  SchematicSummary,
  CompatDiff,
  UnifiedBlock,
  BlockPositionGroup,
} from "../_lib/types";
import type { GameId } from "../_lib/adapters";

interface ResolutionChoice {
  targetId: string;
  applyToAll: boolean;
}

interface ScanProgress {
  pct: number;
  msg: string;
}

interface ToolState {
  // Per-environment game. Source ≠ target enables cross-game conversion
  // (Minecraft ↔ Hytale); equal games do the existing version conversion.
  sourceGame: GameId;
  targetGame: GameId;

  // Worker-held artifacts (referenced by handle), each built by scanning a real
  // Minecraft instance folder.
  sourceReg?: RegistryHandle;
  targetReg?: RegistryHandle;
  schematic?: SchematicSummary;

  // Per-environment scan progress (folder → registry).
  sourceScan?: ScanProgress;
  targetScan?: ScanProgress;

  // Block ids of the target registry, for replacement comboboxes.
  targetBlockIds: string[];

  // Analysis result.
  diff?: CompatDiff;

  // Per-block replacement choices (applied in Phase 4).
  resolutions: Record<string, ResolutionChoice>;

  // ── Phase 3 — 3D viewer ───────────────────────────────────────────────────
  blockPositions: BlockPositionGroup[];
  isFetchingPositions: boolean;
  selectedBlockId?: string;
  layerY: number;
  diffOnlyMode: boolean;

  // UI state.
  isLoadingSource: boolean;
  isLoadingTarget: boolean;
  isLoadingSchematic: boolean;
  isAnalyzing: boolean;
  isExporting: boolean;
  error?: string;

  // Actions
  setSourceGame: (g: GameId) => void;
  setTargetGame: (g: GameId) => void;
  setSourceReg: (h: RegistryHandle | undefined) => void;
  setTargetReg: (h: RegistryHandle | undefined) => void;
  setSourceScan: (p: ScanProgress | undefined) => void;
  setTargetScan: (p: ScanProgress | undefined) => void;
  setTargetBlockIds: (ids: string[]) => void;
  setSchematic: (s: SchematicSummary | undefined) => void;
  setDiff: (d: CompatDiff | undefined) => void;
  setResolution: (block: UnifiedBlock, targetId: string) => void;
  clearResolution: (blockId: string) => void;
  setLoadingSource: (v: boolean) => void;
  setLoadingTarget: (v: boolean) => void;
  setLoadingSchematic: (v: boolean) => void;
  setAnalyzing: (v: boolean) => void;
  setExporting: (v: boolean) => void;
  setError: (msg: string | undefined) => void;
  // Phase 3
  setBlockPositions: (groups: BlockPositionGroup[]) => void;
  setFetchingPositions: (v: boolean) => void;
  setSelectedBlock: (id: string | undefined) => void;
  setLayerY: (y: number) => void;
  setDiffOnlyMode: (v: boolean) => void;
  reset: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  sourceGame: "minecraft",
  targetGame: "minecraft",
  targetBlockIds: [],
  resolutions: {},
  isLoadingSource: false,
  isLoadingTarget: false,
  isLoadingSchematic: false,
  isAnalyzing: false,
  isExporting: false,
  // Phase 3 defaults
  blockPositions: [],
  isFetchingPositions: false,
  layerY: 0,
  diffOnlyMode: false,

  setSourceGame: (g) =>
    set((state) =>
      state.sourceGame === g
        ? state
        : { sourceGame: g, sourceReg: undefined, diff: undefined },
    ),
  setTargetGame: (g) =>
    set((state) =>
      state.targetGame === g
        ? state
        : { targetGame: g, targetReg: undefined, targetBlockIds: [], diff: undefined },
    ),
  setSourceReg: (h) => set({ sourceReg: h }),
  setTargetReg: (h) => set({ targetReg: h }),
  setSourceScan: (p) => set({ sourceScan: p }),
  setTargetScan: (p) => set({ targetScan: p }),
  setTargetBlockIds: (ids) => set({ targetBlockIds: ids }),
  setSchematic: (s) =>
    set({
      schematic: s,
      diff: undefined,
      blockPositions: [],
      selectedBlockId: undefined,
      layerY: s ? s.dimensions.y - 1 : 0,
    }),
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
  setLoadingSource: (v) => set({ isLoadingSource: v }),
  setLoadingTarget: (v) => set({ isLoadingTarget: v }),
  setLoadingSchematic: (v) => set({ isLoadingSchematic: v }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setExporting: (v) => set({ isExporting: v }),
  setError: (msg) => set({ error: msg }),
  // Phase 3
  setBlockPositions: (groups) => set({ blockPositions: groups }),
  setFetchingPositions: (v) => set({ isFetchingPositions: v }),
  setSelectedBlock: (id) => set({ selectedBlockId: id }),
  setLayerY: (y) => set({ layerY: y }),
  setDiffOnlyMode: (v) => set({ diffOnlyMode: v }),
  reset: () =>
    set({
      sourceReg: undefined,
      targetReg: undefined,
      schematic: undefined,
      sourceScan: undefined,
      targetScan: undefined,
      targetBlockIds: [],
      diff: undefined,
      resolutions: {},
      error: undefined,
      isExporting: false,
      blockPositions: [],
      isFetchingPositions: false,
      selectedBlockId: undefined,
      layerY: 0,
      diffOnlyMode: false,
    }),
}));
