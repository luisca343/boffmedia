/**
 * Randomizer API DTOs and response types.
 * Matching Phase-2 API routes for presets, configs, and assignments.
 * Note: "Config" is the randomizer entity for a community event;
 * legacy "Event" refers to tournament-based randomizer events (deprecated).
 */

import type { RandomizerSettings } from "@boffmedia/pack-schema"

// Request DTOs come straight from the API's generated OpenAPI models so the
// frontend and backend can never drift. Do NOT redeclare these locally.
export type {
  CreatePresetDto,
  UpdatePresetDto,
  CreateEventDto,
  UpdateEventDto,
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

// Config view-model — randomizer config for a community event.
// Mirrors the API's ConfigResponseDto fields. Status lifecycle: draft → open → closed → published.
export interface RandomizerConfig {
  id: string
  eventId: number
  gamePlatform: "gba" | "nds"
  gameTitle: string
  settingsBlobSha512: string
  fvxJarSha512: string
  cleanRomSha512: string
  romHint: string | null
  packId?: string | null
  status: "draft" | "open" | "closed" | "published"
  createdAt: string
  updatedAt: string
}

// Legacy event view-model (tournament-based, deprecated).
// Kept for backward compatibility during migration.
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

// Config creation DTO (client sends eventId + presetId; server derives settingsBlobSha512).
export interface CreateConfigDto {
  eventId: number
  presetId: number
  gamePlatform: "gba" | "nds"
  gameTitle: string
  cleanRomSha512: string
  packId: string
  romHint?: string
}

// Config update DTO (draft only; only romHint + packId editable).
export interface UpdateConfigDto {
  romHint?: string
  packId?: string | null
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
  outputSha512?: string
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
