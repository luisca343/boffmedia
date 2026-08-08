/**
 * Randomizer API DTOs and response types.
 * Matching Phase-1 API routes for presets, events, and assignments.
 */

import type { RandomizerSettings } from "@boffmedia/pack-schema"

// Request DTOs come straight from the API's generated OpenAPI models so the
// frontend and backend can never drift. Do NOT redeclare these locally.
export type {
  CreateEventDto,
  UpdateEventDto,
  CreatePresetDto,
  UpdatePresetDto,
} from "@boffmedia/shared"

// Preset view-model — mirrors the API's PresetResponseDto fields. Kept as a clean
// local shape because the generated PresetResponseDto types nullables as `Record<string, any>`.
export interface RandomizerPreset {
  id: string
  name: string
  description?: string | null
  gameScope?: string | null
  settingsJson: RandomizerSettings
  createdAt: string
  updatedAt: string
}

// Event view-model — mirrors the API's EventResponseDto fields (the response the
// admin UI renders). Kept as a clean local shape because the generated
// EventResponseDto types nullable strings as `Record<string, any>`.
export interface RandomizerEvent {
  id: string
  tournamentId: string
  gamePlatform: "gba" | "nds"
  gameTitle: string
  settingsBlobSha512: string
  fvxJarSha512: string
  cleanRomSha512: string
  romHint: string | null
  packId?: string | null
  status: "draft" | "locked" | "running" | "finished"
  createdAt: string
  updatedAt: string
}

export interface RandomizerAssignment {
  id: string
  eventId: string
  participantId: string
  participantName?: string
  status: "pending" | "claimed" | "patched" | "verified"
  seed?: string
  seedSealed?: boolean
  outputHash?: string
  spoilerLog?: string
  createdAt: string
}

export interface DryRunRequest {
  romFile: File
  settings: RandomizerSettings
}

export interface DryRunResult {
  success: boolean
  seedGenerated: string
  warnings: string[]
}
