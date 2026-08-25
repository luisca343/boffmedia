import type { GameType } from "./types"
import minecraftDefaultArt from "../assets/default-art/minecraft.webp"

/** Detail tab definition. */
export type DetailTab = {
  value: string
  label: string
}

/** A game module supplies game-specific configuration for the launcher. */
export type GameModule = {
  /** Whether this module allows local pack creation. */
  canCreate?: boolean

  /** Whether this module allows pack imports. */
  canImport?: boolean

  /** Detail tabs to append to base tabs (gallery, logs, info). */
  detailTabs?: DetailTab[]

  /** i18n key for empty-state message when no packs exist for this module. */
  emptyStateKey?: string

  /** Whether this module shows the crash diagnosis panel. */
  supportsCrashDiagnosis?: boolean

  /** Whether this module shows the missing user files panel. */
  supportsMissingFiles?: boolean

  /** Whether this module shows the instance space (per-instance runtime management). */
  supportsInstanceSpace?: boolean

  /** Whether this module shows the mod browser. */
  supportsBrowse?: boolean

  /** Whether this module shows the setup panel (e.g., EmulatorSetupPanel). */
  supportsSetupPanel?: boolean

  /** Bundled default cover art shown when a pack has no iconUrl. */
  defaultArtUrl?: string
}

/** Minecraft module: all MC-specific tabs, components, and actions. */
const minecraftModule: GameModule = {
  canCreate: true,
  canImport: true,
  emptyStateKey: "noMinecraftPacks",
  supportsMissingFiles: true,
  supportsBrowse: true,
  supportsCrashDiagnosis: true,
  supportsInstanceSpace: true,
  defaultArtUrl: minecraftDefaultArt,
  detailTabs: [
    { value: "content", label: "tabs.content" },
    // Shown only when the pack actually offers choices (or is local, where the
    // author needs the door to define them) — PackDetail filters it. A tab that
    // is empty on most packs is worse than no tab at all.
    { value: "optional", label: "tabs.optional" },
    { value: "files", label: "tabs.files" },
    { value: "worlds", label: "tabs.worlds" },
    { value: "screenshots", label: "tabs.screenshots" },
    { value: "backups", label: "tabs.backups" },
  ],
}

/** Emulator module: setup panel, no library actions, base tabs only. */
const emulatorModule: GameModule = {
  emptyStateKey: "noEmulatorPacks",
  supportsMissingFiles: false,
  supportsBrowse: false,
  supportsSetupPanel: true,
  detailTabs: [],
}

/** Fallback module for unknown game types: base tabs only, no special features. */
const fallbackModule: GameModule = {
  emptyStateKey: "noPacksAvailable",
  supportsMissingFiles: false,
  supportsBrowse: false,
  detailTabs: [],
}

/** Game module registry: maps gameType → module configuration. */
const GAME_MODULES: Record<GameType | string, GameModule> = {
  minecraft: minecraftModule,
  emulator: emulatorModule,
  zomboid: fallbackModule,
  stardew: fallbackModule,
}

/**
 * Get the game module for a given game type.
 * Returns a module with all required slots filled; never undefined.
 * Unknown game types fall through to a safe fallback.
 */
export function getModule(gameType: GameType | string): GameModule {
  return GAME_MODULES[gameType] ?? fallbackModule
}

export { GAME_MODULES, minecraftModule, emulatorModule, fallbackModule }
