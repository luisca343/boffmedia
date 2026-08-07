/**
 * Randomizer API DTOs and response types.
 * Matching Phase-1 API routes for presets, events, and assignments.
 */

import type { RandomizerSettings } from "@boffmedia/pack-schema"

export interface RandomizerPreset {
  id: string
  name: string
  description?: string
  settings: RandomizerSettings
  createdAt: string
  updatedAt: string
}

export interface CreatePresetDto {
  name: string
  description?: string
  settings: RandomizerSettings
}

export interface UpdatePresetDto {
  name?: string
  description?: string
  settings?: RandomizerSettings
}

export interface RandomizerEvent {
  id: string
  tournamentId: string
  title: string
  gamePlatform: "gba" | "nds"
  presetId?: string
  cleanRomSha512: string
  romHint: string
  packId?: string
  status: "draft" | "locked" | "running" | "finished"
  createdAt: string
  updatedAt: string
}

export interface CreateEventDto {
  tournamentId: string
  title: string
  gamePlatform: "gba" | "nds"
  presetId?: string
  cleanRomSha512: string
  romHint: string
  packId?: string
}

export interface UpdateEventDto {
  title?: string
  gamePlatform?: "gba" | "nds"
  presetId?: string
  cleanRomSha512?: string
  romHint?: string
  packId?: string
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
