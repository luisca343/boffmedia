import { create } from "zustand";
import type {
  RegistryHandle,
  SchematicSummary,
  CompatDiff,
  UnifiedBlock,
  BlockPositionGroup,
} from "../_lib/types";
import type { GameId } from "../_lib/adapters";
import type { ErrCode } from "../_lib/errors";
import { DEFAULT_VANILLA_VERSION } from "../_lib/versions";

export type PreviewMode = "source" | "result" | "converted";
export type NavMode = "orbit" | "fly";
export type EnvMode = "instance" | "vanilla";
export type EnvRole = "source" | "target";

/**
 * A scan that stopped because no launcher layout was recognised. Holds the
 * already-collected files so answering the version/loader prompt re-runs the
 * scan without making the user pick the folder a second time.
 */
export interface PendingScan {
  role: EnvRole;
  gameId: GameId;
  files: File[];
}

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

  // How each side sources its environment: scan an instance folder, or use a
  // bundled vanilla registry (no Minecraft install needed).
  sourceEnvMode: EnvMode;
  targetEnvMode: EnvMode;
  sourceVanillaVersion: string;
  targetVanillaVersion: string;

  // Set when a scan could not detect the instance's version — drives the manual
  // version/loader prompt.
  pendingScan?: PendingScan;

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
  // Result-mode only: hide "safe" (unchanged) blocks so the converted/resolved
  // blocks stand out — lets you eyeball conversion progress.
  hideUnchanged: boolean;
  // "source"   → the schematic exactly as it looks in the source game.
  // "converted"→ changed blocks rendered with their target texture + highlighted,
  //              unchanged blocks ghosted so the conversion result stands out.
  previewMode: PreviewMode;
  // "orbit" → drag-to-orbit around the build; "fly" → spectator-style free
  // flight (pointer lock + WASD). Esc / F drop back to orbit.
  navMode: NavMode;

  // UI state.
  isLoadingSource: boolean;
  isLoadingTarget: boolean;
  isLoadingSchematic: boolean;
  isAnalyzing: boolean;
  isExporting: boolean;
  /** Human-readable detail of the last failure (already stripped of its code). */
  error?: string;
  /** Machine code of the last failure, when it carried one — the UI translates it. */
  errorCode?: ErrCode;

  // Actions
  setSourceGame: (g: GameId) => void;
  setTargetGame: (g: GameId) => void;
  setSourceReg: (h: RegistryHandle | undefined) => void;
  setTargetReg: (h: RegistryHandle | undefined) => void;
  setSourceScan: (p: ScanProgress | undefined) => void;
  setTargetScan: (p: ScanProgress | undefined) => void;
  setEnvMode: (role: EnvRole, mode: EnvMode) => void;
  setVanillaVersion: (role: EnvRole, version: string) => void;
  setPendingScan: (p: PendingScan | undefined) => void;
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
  setError: (msg: string | undefined, code?: ErrCode) => void;
  // Phase 3
  setBlockPositions: (groups: BlockPositionGroup[]) => void;
  setFetchingPositions: (v: boolean) => void;
  setSelectedBlock: (id: string | undefined) => void;
  setLayerY: (y: number) => void;
  setHideUnchanged: (v: boolean) => void;
  setPreviewMode: (m: PreviewMode) => void;
  setNavMode: (m: NavMode) => void;
  reset: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  sourceGame: "minecraft",
  targetGame: "minecraft",
  sourceEnvMode: "instance",
  targetEnvMode: "instance",
  sourceVanillaVersion: DEFAULT_VANILLA_VERSION,
  targetVanillaVersion: DEFAULT_VANILLA_VERSION,
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
  hideUnchanged: false,
  previewMode: "source",
  navMode: "orbit",

  setSourceGame: (g) =>
    set((state) =>
      state.sourceGame === g
        ? state
        : {
            sourceGame: g,
            sourceReg: undefined,
            diff: undefined,
            resolutions: {},
            sourceEnvMode: g === "hytale" ? "instance" : state.sourceEnvMode,
          },
    ),
  setTargetGame: (g) =>
    set((state) =>
      state.targetGame === g
        ? state
        : {
            targetGame: g,
            targetReg: undefined,
            targetBlockIds: [],
            diff: undefined,
            // Choices name blocks in the outgoing game's registry.
            resolutions: {},
            // Hytale has no bundled registries — only the folder scan applies.
            targetEnvMode: g === "hytale" ? "instance" : state.targetEnvMode,
          },
    ),
  setSourceReg: (h) => set({ sourceReg: h }),
  // Resolutions name blocks in the OLD target registry — a different target may
  // not have them at all, and a stale choice would silently ride along into the
  // next export. Same reasoning as clearing the diff.
  setTargetReg: (h) => set({ targetReg: h, resolutions: {} }),
  setSourceScan: (p) => set({ sourceScan: p }),
  setTargetScan: (p) => set({ targetScan: p }),
  setEnvMode: (role, mode) =>
    set(role === "source" ? { sourceEnvMode: mode } : { targetEnvMode: mode }),
  setVanillaVersion: (role, version) =>
    set(role === "source" ? { sourceVanillaVersion: version } : { targetVanillaVersion: version }),
  setPendingScan: (p) => set({ pendingScan: p }),
  setTargetBlockIds: (ids) => set({ targetBlockIds: ids }),
  setSchematic: (s) =>
    set({
      schematic: s,
      diff: undefined,
      // A new schematic has its own palette; choices made for the previous one
      // would apply to whichever block ids happen to coincide.
      resolutions: {},
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
  setError: (msg, code) => set({ error: msg, errorCode: code }),
  // Phase 3
  setBlockPositions: (groups) => set({ blockPositions: groups }),
  setFetchingPositions: (v) => set({ isFetchingPositions: v }),
  setSelectedBlock: (id) => set({ selectedBlockId: id }),
  setLayerY: (y) => set({ layerY: y }),
  setHideUnchanged: (v) => set({ hideUnchanged: v }),
  setPreviewMode: (m) => set({ previewMode: m }),
  setNavMode: (m) => set({ navMode: m }),
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
      errorCode: undefined,
      pendingScan: undefined,
      isExporting: false,
      blockPositions: [],
      isFetchingPositions: false,
      selectedBlockId: undefined,
      layerY: 0,
      hideUnchanged: false,
      previewMode: "source",
      navMode: "orbit",
    }),
}));
