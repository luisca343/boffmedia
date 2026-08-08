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
  RandomizerEvent,
  CreateEventDto,
  UpdateEventDto,
  RandomizerAssignment,
  DryRunResult,
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

  // ==================== EVENT OPERATIONS ====================

  /**
   * List events for a tournament.
   */
  static listEvents(tournamentId: string) {
    return apiAuthedAutoGET<RandomizerEvent[]>(`${BASE}/tournaments/${tournamentId}/events`)
  }

  /**
   * Get a specific event by ID.
   */
  static getEvent(id: string) {
    return apiAuthedAutoGET<RandomizerEvent>(`${BASE}/events/${id}`)
  }

  /**
   * Create a new randomizer event.
   */
  static createEvent(data: CreateEventDto) {
    return apiAuthedAutoPOST<RandomizerEvent>(`${BASE}/events`, data)
  }

  /**
   * Update an event.
   */
  static updateEvent(id: string, data: UpdateEventDto) {
    return apiAuthedAutoPATCH<RandomizerEvent>(`${BASE}/events/${id}`, data)
  }

  /**
   * Lock an event (prevent further edits).
   */
  static lockEvent(id: string) {
    return apiAuthedAutoPOST<RandomizerEvent>(`${BASE}/events/${id}/lock`, {})
  }

  /**
   * Finish an event (mark as completed).
   */
  static finishEvent(id: string) {
    return apiAuthedAutoPOST<RandomizerEvent>(`${BASE}/events/${id}/finish`, {})
  }

  /**
   * Perform a dry-run: test settings + ROM for seed generation.
   */
  static async dryRun(id: string, romFile: File): Promise<ApiResponse<DryRunResult>> {
    const formData = new FormData()
    formData.append("rom", romFile)
    return apiAuthedAutoPOST<DryRunResult>(`${BASE}/events/${id}/dry-run`, formData)
  }

  // ==================== ASSIGNMENT OPERATIONS ====================

  /**
   * List all assignments for an event.
   */
  static listAssignments(id: string) {
    return apiAuthedAutoGET<RandomizerAssignment[]>(`${BASE}/events/${id}/assignments`)
  }

  /**
   * Read the admin log for an assignment (judge log).
   * Backend route is nested under the event: events/:eventId/assignments/:assignmentId/log.
   */
  static readLog(eventId: string, assignmentId: string) {
    return apiAuthedAutoGET<string>(`${BASE}/events/${eventId}/assignments/${assignmentId}/log`)
  }

  /**
   * Delete an event.
   */
  static deleteEvent(id: string) {
    return apiAuthedAutoDELETE<void>(`${BASE}/events/${id}`)
  }
}
