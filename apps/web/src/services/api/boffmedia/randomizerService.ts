/**
 * Randomizer service — typed static methods for presets, events, and assignments.
 * Mirrors EventsService pattern. Randomizer DTOs are locally declared in randomizer.types.ts.
 */

import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoDELETE,
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

export class RandomizerService {
  // ==================== PRESET OPERATIONS ====================

  /**
   * List all presets for the authenticated user.
   */
  static listPresets() {
    return apiAuthedAutoGET<RandomizerPreset[]>("/randomizer/presets")
  }

  /**
   * Get a specific preset by ID.
   */
  static getPreset(id: string) {
    return apiAuthedAutoGET<RandomizerPreset>(`/randomizer/presets/${id}`)
  }

  /**
   * Create a new preset.
   */
  static createPreset(data: CreatePresetDto) {
    return apiAuthedAutoPOST<RandomizerPreset>("/randomizer/presets", data)
  }

  /**
   * Update an existing preset.
   */
  static updatePreset(id: string, data: UpdatePresetDto) {
    return apiAuthedAutoPATCH<RandomizerPreset>(`/randomizer/presets/${id}`, data)
  }

  /**
   * Delete a preset.
   */
  static deletePreset(id: string) {
    return apiAuthedAutoDELETE<void>(`/randomizer/presets/${id}`)
  }

  /**
   * Import preset(s) from .rnqs file.
   */
  static async importRnqs(file: File): Promise<ApiResponse<RandomizerPreset[]>> {
    const formData = new FormData()
    formData.append("file", file)
    return apiAuthedAutoPOST<RandomizerPreset[]>("/randomizer/presets/import", formData)
  }

  /**
   * Export preset to .rnqs file (blob).
   */
  static async exportRnqs(id: string): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/randomizer/presets/${id}/export`, {
      method: "GET",
    })
    if (!response.ok) throw new Error(`Export failed: ${response.statusText}`)
    return response.blob()
  }

  // ==================== EVENT OPERATIONS ====================

  /**
   * List events for a tournament.
   */
  static listEvents(tournamentId: string) {
    return apiAuthedAutoGET<RandomizerEvent[]>(`/randomizer/tournaments/${tournamentId}/events`)
  }

  /**
   * Get a specific event by ID.
   */
  static getEvent(id: string) {
    return apiAuthedAutoGET<RandomizerEvent>(`/randomizer/events/${id}`)
  }

  /**
   * Create a new randomizer event.
   */
  static createEvent(data: CreateEventDto) {
    return apiAuthedAutoPOST<RandomizerEvent>("/randomizer/events", data)
  }

  /**
   * Update an event.
   */
  static updateEvent(id: string, data: UpdateEventDto) {
    return apiAuthedAutoPATCH<RandomizerEvent>(`/randomizer/events/${id}`, data)
  }

  /**
   * Lock an event (prevent further edits).
   */
  static lockEvent(id: string) {
    return apiAuthedAutoPATCH<RandomizerEvent>(`/randomizer/events/${id}/lock`, {})
  }

  /**
   * Finish an event (mark as completed).
   */
  static finishEvent(id: string) {
    return apiAuthedAutoPATCH<RandomizerEvent>(`/randomizer/events/${id}/finish`, {})
  }

  /**
   * Perform a dry-run: test settings + ROM for seed generation.
   */
  static async dryRun(id: string, romFile: File): Promise<ApiResponse<DryRunResult>> {
    const formData = new FormData()
    formData.append("rom", romFile)
    return apiAuthedAutoPOST<DryRunResult>(`/randomizer/events/${id}/dry-run`, formData)
  }

  // ==================== ASSIGNMENT OPERATIONS ====================

  /**
   * List all assignments for an event.
   */
  static listAssignments(id: string) {
    return apiAuthedAutoGET<RandomizerAssignment[]>(`/randomizer/events/${id}/assignments`)
  }

  /**
   * Get a specific assignment by ID.
   */
  static getAssignment(id: string) {
    return apiAuthedAutoGET<RandomizerAssignment>(`/randomizer/assignments/${id}`)
  }

  /**
   * Read the admin log for an assignment (judge log).
   */
  static readLog(assignmentId: string) {
    return apiAuthedAutoGET<string>(`/randomizer/assignments/${assignmentId}/log`)
  }

  /**
   * Delete an event.
   */
  static deleteEvent(id: string) {
    return apiAuthedAutoDELETE<void>(`/randomizer/events/${id}`)
  }
}
