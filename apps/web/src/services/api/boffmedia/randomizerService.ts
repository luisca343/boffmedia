/**
 * Randomizer service — typed static methods for presets, events, and assignments.
 * Mirrors EventsService pattern. Randomizer DTOs are locally declared in randomizer.types.ts.
 */

import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoDELETE,
  sessionToken,
  getApiUrl,
} from "@/services/boffAPI"
import type {
  RandomizerPreset,
  CreatePresetDto,
  UpdatePresetDto,
  RandomizerConfig,
  CreateConfigDto,
  UpdateConfigDto,
  RandomizerAssignment,
  RandomizerRom,
} from "./randomizer.types"
import type { ApiResponse } from "@/services/http/core"

// Backend controller is @Controller('randomizer/admin') — all admin routes live under this base.
const BASE = "/randomizer/admin"

export class RandomizerService {
  // ==================== PRESET OPERATIONS ====================

  /**
   * List all presets for the authenticated user.
   */
  static listPresets() {
    return apiAuthedAutoGET<RandomizerPreset[]>(`${BASE}/presets`)
  }

  /**
   * Get a specific preset by ID.
   */
  static getPreset(id: string) {
    return apiAuthedAutoGET<RandomizerPreset>(`${BASE}/presets/${id}`)
  }

  /**
   * Create a new preset.
   */
  static createPreset(data: CreatePresetDto) {
    return apiAuthedAutoPOST<RandomizerPreset>(`${BASE}/presets`, data)
  }

  /**
   * Update an existing preset.
   */
  static updatePreset(id: string, data: UpdatePresetDto) {
    return apiAuthedAutoPATCH<RandomizerPreset>(`${BASE}/presets/${id}`, data)
  }

  /**
   * Delete a preset.
   */
  static deletePreset(id: string) {
    return apiAuthedAutoDELETE<void>(`${BASE}/presets/${id}`)
  }

  /**
   * Import preset(s) from .rnqs file.
   */
  static async importRnqs(file: File): Promise<ApiResponse<RandomizerPreset[]>> {
    const formData = new FormData()
    formData.append("file", file)
    return apiAuthedAutoPOST<RandomizerPreset[]>(`${BASE}/presets/import`, formData)
  }

  /**
   * Export preset to .rnqs file (blob).
   */
  static async exportRnqs(id: string): Promise<Blob> {
    const token = await sessionToken()
    const response = await fetch(`${getApiUrl()}${BASE}/presets/${id}/export`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!response.ok) throw new Error(`Export failed: ${response.statusText}`)
    return response.blob()
  }

  // ==================== ROM LIBRARY OPERATIONS (Phase 3) ====================

  /**
   * List all ROMs in the library.
   */
  static listRoms() {
    return apiAuthedAutoGET<RandomizerRom[]>(`${BASE}/roms`)
  }

  /**
   * Upload a new ROM to the library.
   * Body: multipart/form-data with file field 'rom', plus form fields 'name' and 'gamePlatform'.
   */
  static async uploadRom(
    file: File,
    name: string,
    gamePlatform: "gba" | "nds",
  ): Promise<ApiResponse<RandomizerRom>> {
    const formData = new FormData()
    formData.append("rom", file)
    formData.append("name", name)
    formData.append("gamePlatform", gamePlatform)
    return apiAuthedAutoPOST<RandomizerRom>(`${BASE}/roms`, formData)
  }

  /**
   * Delete a ROM from the library.
   */
  static deleteRom(id: number) {
    return apiAuthedAutoDELETE<void>(`${BASE}/roms/${id}`)
  }

  /**
   * Directly randomize an uploaded ROM with a stored preset (event-less).
   * Returns the randomized ROM as a Blob for download.
   */
  static async quickRandomize(
    presetId: string,
    gamePlatform: "gba" | "nds",
    romFile: File,
    seed?: number,
  ): Promise<Blob> {
    const formData = new FormData()
    formData.append("rom", romFile)
    formData.append("presetId", presetId)
    formData.append("gamePlatform", gamePlatform)
    if (seed !== undefined) formData.append("seed", String(seed))

    const token = await sessionToken()
    const response = await fetch(`${getApiUrl()}${BASE}/quick-randomize`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    })
    if (!response.ok) {
      // The error body is JSON (the standard envelope), not a ROM — surface its message.
      let detail = `${response.status} ${response.statusText}`
      try {
        const body = await response.json()
        detail = body?.userMessage || body?.message || detail
      } catch {
        /* non-JSON body — keep the status line */
      }
      throw new Error(detail)
    }
    return response.blob()
  }

  // ==================== CONFIG OPERATIONS (Event-based, Phase 2) ====================

  /**
   * Create a new randomizer config for a community event.
   * Body: { eventId, presetId, gamePlatform, gameTitle, cleanRomSha512, romHint? }
   * Server derives settingsBlobSha512 from the preset.
   */
  static createConfig(data: CreateConfigDto) {
    return apiAuthedAutoPOST<RandomizerConfig>(`${BASE}/configs`, data)
  }

  /**
   * Get a specific config by ID.
   */
  static getConfig(id: string) {
    return apiAuthedAutoGET<RandomizerConfig>(`${BASE}/configs/${id}`)
  }

  /**
   * Update a config (draft only; only romHint + packId editable).
   */
  static updateConfig(id: string, data: UpdateConfigDto) {
    return apiAuthedAutoPATCH<RandomizerConfig>(`${BASE}/configs/${id}`, data)
  }

  /**
   * Transition config from draft → open.
   */
  static openConfig(id: string) {
    return apiAuthedAutoPOST<RandomizerConfig>(`${BASE}/configs/${id}/open`, {})
  }

  /**
   * Transition config from open → closed.
   */
  static closeConfig(id: string) {
    return apiAuthedAutoPOST<RandomizerConfig>(`${BASE}/configs/${id}/close`, {})
  }

  /**
   * Transition config from closed → published (seeds + settings become public).
   */
  static publishConfig(id: string) {
    return apiAuthedAutoPOST<RandomizerConfig>(`${BASE}/configs/${id}/publish`, {})
  }

  /**
   * List all assignments for a config.
   */
  static listConfigAssignments(configId: string) {
    return apiAuthedAutoGET<RandomizerAssignment[]>(`${BASE}/configs/${configId}/assignments`)
  }

  /**
   * Read the admin log for an assignment.
   * Backend route: configs/:configId/assignments/:assignmentId/log
   */
  static readConfigLog(configId: string, assignmentId: string) {
    return apiAuthedAutoGET<string>(`${BASE}/configs/${configId}/assignments/${assignmentId}/log`)
  }

  /**
   * Delete a config (draft only).
   */
  static deleteConfig(id: string) {
    return apiAuthedAutoDELETE<void>(`${BASE}/configs/${id}`)
  }

  // ==================== PUBLIC OPERATIONS (No Auth) ====================

  /**
   * Get the config for a community event (public — no auth required).
   * Settings blob hash only included when config.status === 'published'.
   */
  static getEventConfig(eventId: number) {
    return fetch(`${getApiUrl()}/randomizer/public/events/${eventId}/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((resp) => ({
        success: true,
        data: resp.data || resp,
        statusCode: 200,
      }))
      .catch((err) => ({
        success: false,
        statusCode: err.status || 500,
        error: err.statusText || 'Failed to fetch config',
      }))
  }

  /**
   * List assignments for a community event config (public — no auth required).
   * Seed only included when config.status === 'published'.
   */
  static getPublicAssignments(eventId: number) {
    return fetch(`${getApiUrl()}/randomizer/public/events/${eventId}/assignments`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((resp) => ({
        success: true,
        data: resp.data || resp,
        statusCode: 200,
      }))
      .catch((err) => ({
        success: false,
        statusCode: err.status || 500,
        error: err.statusText || 'Failed to fetch assignments',
      }))
  }

  /**
   * Download event config settings file (.rnqs) — public.
   * Only available when config.status === 'published'.
   */
  static async downloadConfigSettings(eventId: number): Promise<Blob> {
    const response = await fetch(
      `${getApiUrl()}/randomizer/public/events/${eventId}/settings`,
    )
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(
        body.userMessage || `Settings download failed: ${response.statusText}`,
      )
    }
    return response.blob()
  }

  /**
   * Download assignment log file — public.
   * Only available when config.status === 'published'.
   */
  static async downloadPublicLog(
    eventId: number,
    assignmentId: string,
  ): Promise<Blob> {
    const response = await fetch(
      `${getApiUrl()}/randomizer/public/events/${eventId}/assignments/${assignmentId}/log`,
    )
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(
        body.userMessage || `Log download failed: ${response.statusText}`,
      )
    }
    return response.blob()
  }

}
